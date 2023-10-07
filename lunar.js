const async = require('async')
const needle = require('needle')
const fs = require('fs')
const XLSX = require('xlsx')

class Lunar {
    constructor({
            foc_date = '',
            download_delay = 500
        } = {}) {
        this.foc_date = foc_date
        this.foc_url = ''
        this.foc_xlsx_file = ''
        this.foc_image_dir = ''
        this.foc_items = []
        this.download_delay = download_delay
    }


    run() {
        async.series([
            this.get_foc_url.bind(this),
            this.get_foc_date.bind(this),
            this.get_foc_xlsx.bind(this),
            this.read_foc_xlsx.bind(this),
            this.create_image_dir.bind(this),
            this.download_images.bind(this)
        ])
    }


    download_images(callback) {
        console.log('Lunar.download_images()')
    
        async.eachOfLimit(this.foc_items, 1, (item, key, each_callback) => {
            if(item.Publisher.trim().toUpperCase()!='DC COMICS')
                return each_callback()

            process.stdout.write(`Getting image for [${item.ProductCode}] ${item.Title} ... `)
    
            if(fs.existsSync(`${this.foc_image_dir}/${item.ProductCode}.jpg`)) {
                console.log('already downloaded!')
                return each_callback()
            }

            needle.get(`https://media.lunardistribution.com/images/covers/hires/${item.ProductCode}.jpg`, (err, resp) => {
                fs.writeFileSync(`${this.foc_image_dir}/${item.ProductCode}.jpg`, resp.body)
                console.log(`${item.ProductCode}.jpg`)
                setTimeout(each_callback, this.download_delay)
            })
        }, callback)
    }


    create_image_dir(callback) {
        console.log('Lunar.create_image_dir()')

        if(!fs.existsSync(this.foc_image_dir))
            fs.mkdirSync(this.foc_image_dir)

        callback()
    }


    read_foc_xlsx(callback) {
        console.log('Lunar.read_foc_xlsx()')

        const wb = XLSX.readFile(this.foc_xlsx_file)
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        this.foc_items = XLSX.utils.sheet_to_json(ws)

        callback()
    }


    get_foc_xlsx(callback) {
        console.log('Lunar.get_foc_xlsx()')

        if(fs.existsSync(this.foc_xlsx_file))
            return callback()

        needle.get(this.foc_url, (err, resp) => {
            fs.writeFile(this.foc_xlsx_file, resp.body, callback)
        })
    }


    get_foc_date(callback) {
        console.log('Lunar.get_foc_date()')

        const dateObj = new Date(this.foc_url.split('foc=')[1])

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');  // Months are 0-based, so we add 1
        const day = String(dateObj.getDate()).padStart(2, '0');

        this.foc_date = `${year}-${month}-${day}`

        this.foc_xlsx_file = `./downloads/lunar/foc-${this.foc_date}.xlsx`
        this.foc_image_dir = `./downloads/lunar/images/${this.foc_date}`

        callback()
    }


    get_foc_url(callback) {
        if(this.foc_date!='') {
            this.foc_url = `https://www.lunardistribution.com/home/productdatafile?foc=${this.foc_date}`
            return callback()
        }

        console.log('Lunar.get_spreadsheet_url()')
    
        needle.get('https://www.lunardistribution.com/', (err, resp) => {
            let html = resp.body
            const regex = /<button [^>]*?data-val="([^"]+)"[^>]*?>/;
            const match = html.match(regex);
    
            this.foc_url = `https://www.lunardistribution.com/home/productdatafile?foc=${match[1]}`
    
            callback()
        })
    }
}


module.exports = Lunar