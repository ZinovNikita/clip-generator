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
    a.forEach((v,i)=>{
        document.querySelector('#segmentation-body .card-subtitle').innerHTML = './input/'+v;
        ffmpeg('./input/'+v).noAudio().size('1280x720').fps(25)
        .outputOptions(['-force_key_frames expr:gte(t,n_forced)','-map 0','-segment_time 1.0','-f segment','-reset_timestamps 1'])
        .on('error',err=>{
            document.querySelector('#segmentation-body').innerHTML += '<span class="badge badge-danger">Error '+v+': ' + err.message+'</span><br>';
            console.error(err);
        })
        .on('end',()=>{
            doneCount++;
            let p = (Math.round(doneCount/a.length * 1000)/10)+'%';
            document.querySelector('#segmentation-body .progress-bar').style.width = p;
            document.querySelector('#segmentation-body .card-title').innerHTML = p;
            console.log(doneCount,a.length,doneCount==a.length)
            if(doneCount==a.length)
                document.querySelector('#segmentation-body button.btn').removeAttribute('disabled');
            document.querySelector('#segmentation-body').innerHTML += '<span class="badge badge-success">'+v+' finished!</span><br>';
        })
        .save('./segments/'+(new Date().getTime())+'%5d.mp4');
    });
}
const Clipping = ()=>{
    let m = fs.readdirSync("./audio");
    if(!m||m.length==0) return alert('Empty ./audio folder');
    let fls = fs.readdirSync("./segments");
    let doneCount = 0;
    document.querySelector('#clipping-body .card-title').innerHTML = '0%';
    document.querySelector('#clipping-body button.btn').setAttribute('disabled',true);
	m.forEach((a,i)=>{
        new WebAudioAPI.AudioContext().decodeAudioData(fs.readFileSync("./audio/"+a).buffer,audioBuffer=>{
            document.querySelector('#clipping-body .card-subtitle').innerHTML = './audio/'+a;
            let dur = Math.ceil(audioBuffer.duration);
			var fn = new Date().getTime();
            let ff = ffmpeg();
			for(var j=0;j<=dur;j++)
                ff.input('./segments/'+fls[rndInt(0,fls.length)]);
            ff.on('error',err=>{
                document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-danger">Error clipping '+a+'</span><br>';
                console.error(err);
            })
            .on('end',()=>{
                doneCount++;
                let p = (Math.round(doneCount/m.length * 500)/10)+'%';
                document.querySelector('#clipping-body .progress-bar').style.width = p;
                document.querySelector('#clipping-body .card-title').innerHTML = p;
                document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-success">Clipping for '+a+' finished!</span><br>';
                ffmpeg('./tmp/'+fn+'.mp4').input("./audio/"+a).outputOptions(['-ss 00:00:00','-t '+durationString(dur)])
                .on('error',err=>{
                    document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-danger">Error merging '+a+' with '+fn+'.mp4</span><br>';
                    console.error(err);
                })
                .on('end',()=>{
                    doneCount++;
                    p = (Math.round(doneCount/m.length * 500)/10)+'%';
                    document.querySelector('#clipping-body .progress-bar').style.width = p;
                    document.querySelector('#clipping-body .card-title').innerHTML = p;
                    if(doneCount==m.length*2)
                        document.querySelector('#clipping-body button.btn').removeAttribute('disabled');
                    document.querySelector('#clipping-body').innerHTML += '<span class="badge badge-success">Merging '+fn+'.mp4 finished!</span><br>';
                })
                .save('./results/'+fn+'.mp4');
            })
            .mergeToFile('./tmp/'+fn+'.mp4');
        })
    });
}