const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const [_,__, rootDir] = process.argv
if (!rootDir || !fs.existsSync(rootDir)) {
    console.error('Корневая папка не указана или не существует')
    process.exit()
}
const files = fs.readdirSync(`${rootDir}/input`).filter(f => f.slice(-4) === '.mp4')
if (!files || files.length==0) {
    console.error('Папка-источник не содержит файлов *.mp4')
    process.exit()
}
const split = (i, j) => {
    if (i >= files.length) {
        console.log(`Процесс обработки завершен`)
        return
    }
    const file = files[i]
    if (j === 0)
        console.log(`start ${file}`)
    ffmpeg.ffprobe(`${rootDir}/input/${file}`, (_, v) => {
        if (j + 1 >= v.format.duration) {
            console.log(`finish ${file}`)
            split(i+1, 0)
            return 
        }
        ffmpeg(`${rootDir}/input/${file}`).setStartTime(j).setDuration(1)
        .videoCodec('libx264').size('1280x720').fps(25).videoBitrate(1280)
        .audioCodec('aac').audioFrequency(48000).audioBitrate(64).audioChannels(1).audioQuality(1).audioFilters("loudnorm")
        .outputOptions(['-threads 0'])
        .on('end',() => split(i, j+10)).save(`${rootDir}/segments/${new Date().getTime()}.mp4`)
        .on('error',() => split(i, j+10))
    })
}
split(0, 0)
