import { defineProxyStore } from "../../../pinata/lib/defineStore";

export const { store, watch } = defineProxyStore("store", {
  state: {
    name: "test",
    number: 1,
    rotation: [0, 0, 0, 0],
    data: {
      first: "test",
      second: "test2",
    },
  },
  actions: {
    increment() {
      this.data.first = "test" + this.number;
      console.log("increment", this.number);
      this.number += 1;
    },
  },
});
