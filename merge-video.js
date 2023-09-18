const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const [_,__, rootDir, count, minutes] = process.argv
if (!rootDir || !fs.existsSync(rootDir)) {
    console.error('Корневая папка не указана или не существует')
    process.exit()
}
if (isNaN(Number(count)) || Number(count) > 10) {
    console.error('Количество видео не является числом или превышает 10')
    process.exit()
}
if (isNaN(Number(minutes)) || Number(minutes) > 120) {
    console.error('Длительность видео не является числом или превышает 120 минут')
    process.exit()
}
Array.prototype.shuffle = function () {
    let j
    for (let l = 0; l < this.length; l++) {
        for (let i = this.length-1; i >= 0; i--) {
            j = Math.floor(Math.random() * (this.length-1))
            if (j < this.length && i !== j)
                [this[i], this[j]] = [this[j], this[i]]
        }
    }
}
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * (this.length - 1))]
}
const duration = Number(minutes) * 60
const files = fs.readdirSync(`${rootDir}/segments`).filter(f => f && f.slice(-4) === '.mp4').map(f=>`${rootDir}/segments/${f}`)
const audios = fs.readdirSync(`${rootDir}/audios`).filter(f => f && f.slice(-4) === '.mp3').map(f=>`${rootDir}/audios/${f}`)
const voices = fs.readdirSync(`${rootDir}/voice`).filter(f => f && f.slice(-4) === '.mp3').map(f=>`${rootDir}/voice/${f}`)

if (!files || files.length==0) {
    console.error('Папка-источник не содержит файлов *.mp4')
    process.exit()
}
const merge = (i) => {
    if (i >= Number(count)) {
        console.log(`Процесс обработки завершен`)
        return
    }
    const segments = []
    files.shuffle()
    audios.shuffle()
    voices.shuffle()
    for (let j=0; j < duration; j++) {
        const file = files.random()
        if(fs.existsSync(file))
            segments.push(`file '${file}'`)
    }
    const name = new Date().getTime()
    fs.writeFileSync(`${rootDir}/results/${name}.txt`, segments.join('\n'))
    console.log(`start ${rootDir}/results/${name}.mp4`)
    ffmpeg(`${rootDir}/results/${name}.txt`)
    .inputOptions(['-f concat','-safe 0'])
    .outputOptions(['-c copy'])
    .on('end', () => {
        fs.unlinkSync(`${rootDir}/results/${name}.txt`)
        const audio = audios.random()
        ffmpeg.ffprobe(audio, (_, a) => {
            if (!a || !a.format)
                throw new Error('Не удалось открыть музыку')
            const voice = voices.random()
            ffmpeg.ffprobe(voice, (_, v) => {
                if (!v || !v.format)
                    throw new Error('Не удалось открыть озвучку')
                let result = ffmpeg(`${rootDir}/results/${name}_tmp.mp4`)
                .input(audio).seekInput(Math.random() * (a.format.duration - duration))
                .input(voice).seekInput(Math.random() * (v.format.duration - duration))
                .complexFilter([
                    { filter: 'amix', options: { inputs: 3, duration: 'first', weights: '1 1.5 2', normalize: 0, dropout_transition: 0} }
                ])
                .on('end', () => {
                    fs.unlinkSync(`${rootDir}/results/${name}_tmp.mp4`)
                    console.log(`finish ${rootDir}/results/${name}.mp4`)
                    merge(i+1)
                })
                .on('error', (e) => {
                    fs.unlinkSync(`${rootDir}/results/${name}_tmp.mp4`)
                    console.log(`error ${rootDir}/results/${name}.mp4`, 'ffmpeg '+result._getArguments().join(' '), e.message)
                    merge(i+1)
                })
                .save(`${rootDir}/results/${name}.mp4`)
            })
        })
    })
    .on('error', (e) => {
        fs.unlinkSync(`${rootDir}/results/${name}.txt`)
        console.log(`error ${rootDir}/results/${name}_tmp.mp4`, e.message)
        merge(i+1)
    })
    .save(`${rootDir}/results/${name}_tmp.mp4`)
}
merge(0)
