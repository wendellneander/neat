import * as fs from 'fs'

export default class Logger {
  constructor(
    private logs: any[] = [],
    private errors: any[] = [],
  ) { }

  log(title: string, data: any) {
    this.logs.push({ key: title, data })
  }

  error(title: string, data: any) {
    this.errors.push({ key: title, data })
  }

  exportFile() {
    fs.writeFileSync('src/result.json', JSON.stringify({ logs: this.logs, errors: this.errors }))
  }
}