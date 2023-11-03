export default class Resource {
  file?: string;

  constructor(filePath?: string) {
    this.file = filePath;
  }

  upload() {}
}
