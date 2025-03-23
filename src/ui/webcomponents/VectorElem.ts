import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("vector-elem")
export default class VectorElem extends LitElement {
  @property({ type: Array }) vector = [];
  @property({ type: Number }) num = 0;

  render() {
    const lis = [];
    this.vector.forEach((v) => lis.push(html`<div>${v}</div>`));
    return html` <div class="vector">vector: ${lis}</div> `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.vector.map((v) => console.log(v));
    console.log(this.vector);
  }
}
