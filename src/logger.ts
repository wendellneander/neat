import * as fs from 'fs'

export default class Logger {
  constructor(
    private logs: { [key: string]: string } = {},
    private errors: { [key: string]: string } = {},
  ) { }

  log(key: string, data: any) {
    this.logs[key] = data
  }

  error(key: string, data: any) {
    this.errors[key] = data
  }

  exportFile() {
    fs.writeFileSync('src/result.json', JSON.stringify({ logs: this.logs, errors: this.errors }))
  }
}