import Component from "./Component.ts";
import Resource from "./Resource.ts";

export default class Actor {
  components: Component[] = [];
  constructor(res: Resource) {
    res.upload();
  }
  render() {
    // console.log("render");
  }
}
