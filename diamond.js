const async = require('async')
const needle = require('needle')
const fs = require('fs')

class Diamond {
    constructor({
            foc_date = '',
            download_delay = 500
        } = {}) {
        this.foc_date = foc_date
        this.foc_url = ''
        this.foc_txt = ''
        this.foc_txt_file = ''
        this.foc_image_dir = ''
        this.foc_items = []
        this.download_delay = download_delay
    }

    run() {
        async.series([
            this.get_foc_url.bind(this),
            this.get_foc_date.bind(this),
            this.get_foc_txt.bind(this),
            this.read_foc_txt.bind(this),
            this.parse_foc_txt.bind(this),
            this.create_image_dir.bind(this),
            this.download_images.bind(this)
        ])
    }


    download_images(callback) {
        console.log('Diamond.download_images()')
    
        async.eachOfLimit(this.foc_items, 1, (item, key, each_callback) => {
            process.stdout.write(`Getting image for [${item.code}] ${item.title} ... `)
    
            if(fs.existsSync(`${this.foc_image_dir}/${item.code}.jpg`)) {
                console.log('already done!')
                return each_callback()
            }
    
            needle.get(`https://previewsworld.com/Catalog/${item.code}`, (err, resp) => {
                const regex = /<img [^>]*?id="MainContentImage"[^>]*?src="([^"]+)"[^>]*?>/
                const match = resp.body.match(regex)
    
                needle.get(`https://previewsworld.com/${match[1]}`, (err, resp) => {
                    fs.writeFileSync(`${this.foc_image_dir}/${item.code}.jpg`, resp.body)
                    console.log(`${item.code}.jpg`)
                    setTimeout(each_callback, this.download_delay)
                })
            })
        }, callback)
    }


    create_image_dir(callback) {
        console.log('Diamond.create_image_dir()')

        if(!fs.existsSync(this.foc_image_dir))
            fs.mkdirSync(this.foc_image_dir)

        callback()
    }


    parse_foc_txt(callback) {
        console.log('Diamond.parse_foc_txt()')
    
        let recording = false
        let section
    
        this.foc_txt.split("\n").forEach((line) => {
            line = line.trim()
    
            // Skip empty lines
            if(line.length==0)
                return
    
            // If the recording flag is not set, skip this line
            if(recording==false) {
                // If it's not set but we see PREMIER PUBLISHERS, set the flag
                if(line.toUpperCase().includes('PREMIER PUBLISHERS'))
                    recording = true
    
                return
            }
    
            // If the line does not contain a tab, it's a section header
            if(!line.includes("\t")) {
                section = line;
                return
            }
    
            // Skip MAGAZINES, BOOKS, and MERCHANDISE
            if(['DC COMICS', 'MAGAZINES', 'BOOKS', 'MERCHANDISE'].includes(section.toUpperCase()))
                return
    
            // If we've made it this far, we probably are processing actual stuff now
            line = line.split("\t")
    
            this.foc_items.push({
                section: section,
                code: line[0],
                title: line[1],
                price: line[2]
            })
        })

        callback()
    }


    read_foc_txt(callback) {
        console.log('Diamond.read_foc_txt()')
    
        fs.readFile(this.foc_txt_file, (err, data) => {
            this.foc_txt = data.toString()
            callback()
        })
    }


    get_foc_txt(callback) {
        console.log('Diamond.get_foc_txt()')

        if(fs.existsSync(this.foc_txt_file))
            return callback()

        needle.get(`https://previewsworld.com${this.foc_url}`, (err, resp) => {
            fs.writeFile(this.foc_txt_file, resp.body, callback)
        })
    }


    get_foc_date(callback) {
        console.log('Diamond.get_foc_date()')

        const regex = /releaseDate=(\d{2}\/\d{2}\/\d{4})/
        const match = this.foc_url.match(regex)
    
        const dateStr = match[1]
        const [month, day, year] = dateStr.split('/')
        this.foc_date = `${year}-${month}-${day}`

        this.foc_txt_file = `./downloads/diamond/foc-${this.foc_date}.txt`
        this.foc_image_dir = `./downloads/diamond/images/${this.foc_date}`
        
        callback()
    }


    get_foc_url(callback) {
        console.log('Diamond.get_foc_url()')

        if(this.foc_date!='') {
            this.foc_url = `https://previewsworld.com/FinalOrdersDue/Export?format=txt&releaseDate=${this.foc_date}`
            return callback()
        }

        needle.get('https://previewsworld.com/FinalOrdersDue', (err, resp) => {
            let html = resp.body
            const regexPattern = '<a [^>]*?href="(/FinalOrdersDue\\/Export\\?format=txt&releaseDate=[^"]+)"[^>]*?>';
            const regex = new RegExp(regexPattern);
            const match = html.match(regex);
    
            this.foc_url = match[1]
            callback()
        })
    }
}


module.exports = Diamond