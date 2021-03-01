const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const WebAudioAPI = require('web-audio-api');
const rndInt = (min, max)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
const durationString = secs=>{
    let hr  = Math.floor(secs / 3600);
    let min = Math.floor((secs - (hr * 3600))/60);
    let sec = Math.floor(secs - (hr * 3600) -  (min * 60));
    if(hr < 10) hr = "0" + hr;
    if(min < 10) min = "0" + min;
    if(sec < 10) sec = "0" + sec;
    return hr+':'+min+':'+sec;
}
const Segmentation = ()=>{
    let a = fs.readdirSync("./input");
    if(!a||a.length==0) return alert('Empty ./input folder');
    let doneCount = 0;
    document.querySelector('#segmentation-body .card-title').innerHTML = '0%';
    document.querySelector('#segmentation-body button.btn').setAttribute('disabled',true);
    const recurcy = (i)=>{
        let v = a[i];
        document.querySelector('#segmentation-body .card-subtitle').innerHTML = './input/'+v;
        ffmpeg('./input/'+v).noAudio().size('1280x720').fps(25)
        .outputOptions(['-force_key_frames expr:gte(t,n_forced)','-map 0','-segment_time 0.5','-f segment','-reset_timestamps 1'])
        .on('progress', function(progress) {
            doneCount += progress.percent/100;
            let p = (doneCount/a.length * 100).toFixed(2)+'%';
            document.querySelector('#segmentation-body .progress-bar').style.width = p;
            document.querySelector('#segmentation-body .card-title').innerHTML = p;
        })
        .on('error',err=>{
            document.querySelector('#segmentation-body').innerHTML += '<span class="badge badge-danger">Error '+v+': ' + err.message+'</span><br>';
            console.error(err);
            if(i<a.length-1) recurcy(++i);
        })
        .on('end',()=>{
            if(i==a.length-1)
                document.querySelector('#segmentation-body button.btn').removeAttribute('disabled');
            document.querySelector('#segmentation-body').innerHTML += '<span class="badge badge-success">'+v+' finished!</span><br>';
            if(i<a.length-1) recurcy(++i);
        })
        .save('./segments/'+i+'_'+(new Date().getTime())+'%5d.mp4');
    };
    recurcy(0,0.1);
}
const Clipping = ()=>{
    let m = fs.readdirSync("./audio");
    if(!m||m.length==0) return alert('Empty ./audio folder');
    let doneCount = 0;
    document.querySelector('#clipping-body .card-title').innerHTML = '0%';
    document.querySelector('#clipping-body button.btn').setAttribute('disabled',true);
	const recurcy = (i)=>{
        let a = m[i];
        new WebAudioAPI.AudioContext().decodeAudioData(fs.readFileSync("./audio/"+a).buffer,audioBuffer=>{
            document.querySelector('#clipping-body .card-subtitle').innerHTML = './audio/'+a;
            let pcmdata = audioBuffer.getChannelData(0).map(el=>{return Math.abs(el)});
            let count = 0;
            let max = 0;
            pcmdata.forEach(n=>{max = n > max ? n : max});
            pcmdata.forEach(n=>{
                if(n > (max-0.3) && n < (max+0.3))
                    count++;
            });
            let bpm = Math.ceil(10/(count/audioBuffer.sampleRate))/10;
            let dur = Math.ceil(audioBuffer.duration);
			var fn = new Date().getTime();
            let ff = [];
            let fls = fs.readdirSync("./segments");
			for(var j=0;j<=dur;j++)
                ff.push("file 'C:/Users/zinov/Documents/mugen2/segments/"+fls[rndInt(0,fls.length-1)]+"'");
            fs.writeFileSync("./list.txt", ff.join('\n'));
            ffmpeg('list.txt').inputOptions(['-f concat','-safe 0']).outputOptions(['-c copy'])
            .on('progress', function(progress) {
                console.log('Processing concat: ' + progress.percent + '% done');
            })
            .on('error',err=>{
                document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-danger">Error clipping '+a+': '+err.message+'</span><br>';
                document.querySelector('#clipping-body button.btn').removeAttribute('disabled');
                console.error(err);
            })
            .on('end',()=>{
                doneCount++;
                let p = (Math.round(doneCount/m.length * 500)/10)+'%';
                document.querySelector('#clipping-body .progress-bar').style.width = p;
                document.querySelector('#clipping-body .card-title').innerHTML = p;
                document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-success">Clipping for '+a+' finished!</span><br>';
                ffmpeg('./tmp/'+fn+'.mp4').input("./audio/"+a).outputOptions(['-ss 00:00:00','-t '+durationString(dur)])
                .on('progress', function(progress) {
                    console.log('Processing merge: ' + progress.percent + '% done');
                })
                .on('error',err=>{
                    document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-danger">Error merging '+a+' with '+fn+'.mp4: '+err.message+'</span><br>';
                    console.error(err);
                    if(i<m.length-1) recurcy(++i);
                })
                .on('end',()=>{
                    doneCount++;
                    p = (Math.round(doneCount/m.length * 500)/10)+'%';
                    document.querySelector('#clipping-body .progress-bar').style.width = p;
                    document.querySelector('#clipping-body .card-title').innerHTML = p;
                    if(doneCount==m.length*2)
                        document.querySelector('#clipping-body button.btn').removeAttribute('disabled');
                    document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-success">Merging '+fn+'.mp4 finished!</span><br>';
                    fs.unlinkSync('./tmp/'+fn+'.mp4');
                    if(i<m.length-1) recurcy(++i);
                })
                .save('./results/'+fn+'.mp4');
            })
            .save('./tmp/'+fn+'.mp4');
        })
    };
    recurcy(0);
}
const getBPM = (path)=>{
    new WebAudioAPI.AudioContext().decodeAudioData(fs.readFileSync(path).buffer,audioBuffer=>{
        let pcmdata = audioBuffer.getChannelData(0).map(el=>{return Math.abs(el)});
        let count = 0;
        let max = 0;
        pcmdata.forEach(n=>{max = n > max ? n : max});
        pcmdata.forEach(n=>{
            if(n > (max-0.3) && n < (max+0.3))
                count++;
        });
        console.log(Math.ceil(count/audioBuffer.sampleRate*60));
    })
}