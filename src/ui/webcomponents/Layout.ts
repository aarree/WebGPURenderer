import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("layout-element")
export class Layout extends LitElement {
  static styles = css`
    .layout {
      display: grid;
      grid-template-areas:
        "head head"
        "sidebar  main";
      grid-template-rows: 3rem 1fr;
      grid-template-columns: 30rem 1fr;
      height: 100vh;
      overflow: hidden;

      .header {
        grid-area: head;
        width: 100%;
        background: white;
        padding: 0.5rem;
        border-bottom: 0.1rem solid black;
      }
      .sidebar {
        grid-area: sidebar;
        height: 100%;
        border-right: 0.1rem solid black;
        overflow: auto;
        scrollbar-width: thin;
      }

      .main {
        grid-area: main;
        height: 100%;
      }
    }
  `;

  protected render() {
    return html`
      <div class="layout">
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="sidebar">
          <slot name="sidebar"></slot>
        </div>
        <div class="main">
          <slot name="main"></slot>
        </div>
      </div>
    `;
  }
}
