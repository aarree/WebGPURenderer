// import BaseComponent from "./../BaseComponent.ts";
import { LitElement, css, html } from "lit";
import PanelStyles from "./Panel.css";
import { customElement, property } from "lit/decorators.js";

@customElement("pine-panel")
export class Panel extends LitElement {
  static styles = css`
    .panel {
      background: #fff;
      border-radius: 0.25rem;
      padding: 1rem;
      margin: 1rem;
      border: 0.1rem solid black;

      .title,
      .subtitle {
        margin: 0;
        line-height: 1;
        text-align: right;
      }

      .subtitle {
        margin-bottom: 0.5rem;
      }
    }
  `;

  @property({ type: String })
  title: string = "";

  @property({ type: String })
  subtitle: string = "";

  render() {
    return html`<div class="panel">
      <p class="subtitle">${this.subtitle}</p>
      <h2 class="title">${this.title}</h2>
      <div class="content">
        <slot></slot>
      </div>
    </div>`;
  }
  //
  // connectedCallback() {
  //   Panel.observedAttributes.forEach((attr) => {
  //     console.log(typeof attr);
  //     this.props[attr] = this.getAttribute(attr);
  //   });
  //   this.update(this.template());
  // }
  //
  // attributeChangedCallback(name, _, newValue) {
  //   this.props[name] = newValue;
  //   this.update(this.template());
  // }
}
//
// export const setupPanelComponent = () => {
//   customElements.define("pine-panel", Panel);
// };
