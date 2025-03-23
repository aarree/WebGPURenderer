import { store, watch } from "./../../state/Store.ts";
import {
  store as engineStore,
  watch as engineWatch,
} from "./../../classes/SRenderer.ts";
import "./VectorElem.ts";
// import html from "snabby";
// import BaseComponent from "./BaseComponent.ts";
import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("debug-store")
export class DebugStoreComponent extends LitElement {
  static styles = css`
    .button {
      background-color: white;
      border-radius: 0.25rem;
      border: 0.1rem solid black;
      color: black;
      padding: 0.75rem 1rem;
      text-align: center;
      text-decoration: none;
      font-size: 1.4rem;
      cursor: pointer;
    }

    pine-panel {
      top: 0;
      max-width: 300px;
    }
  `;

  @state()
  private _number = 0;

  @state({ type: Array })
  actors = engineStore.state.actors;

  constructor() {
    super();
    console.log(this.actors);
  }
  render() {
    return html`
      <div>
        <pine-panel
          title="${store.state.name}"
          subtitle="VectorValues and name"
        >
          ${this.actors.map(
            (actor) =>
              html`<pine-panel
                title="${actor.label}"
                subtitle="${actor.constructor.name}"
              >
                <br />

                ${actor.constructor.name}
                <br />
                <button
                  @click=${() => console.log(actor.constructor.name, actor)}
                  class="button"
                >
                  log actor
                </button>
                ${Array.from(actor._components).map(
                  ([k, v]) => html`
                    <div>
                      <br />
                      ${k} : ${v.constructor.name}
                      <button
                        @click=${() => console.log(v.constructor.name, v)}
                        class="button"
                      >
                        log comp
                      </button>
                      ${v.__raw && v.__raw.constructor.name === "Transform"
                        ? html` <div>
                            <vector-elem
                              .vector="${[...v.transform]}"
                            ></vector-elem>
                            <button
                              @click=${() => {
                                console.log(v);
                                v.transform[0]++;
                              }}
                              class="button"
                            >
                              Move right
                            </button>
                          </div>`
                        : ``}
                      ${v.constructor.name === "Camera"
                        ? html`<vector-elem
                            .vector="${[...v.camera.rotation]}"
                          />`
                        : ``}
                    </div>
                  `,
                )}
              </pine-panel>`,
          ) ?? nothing}
          number ${this._number} <br />
          <button @click=${() => this.render()} class="button">
            Increment
          </button>
        </pine-panel>
      </div>
    `;
  }
  //
  connectedCallback() {
    super.connectedCallback();
    this._number = store.state.number;
    // this.actors = State.module.getStore("engine").state.actors;
    //   const input = this.shadowRoot?.querySelector("#input") as HTMLInputElement;
    //   this.engineState = State.module.getStore("engine").store;
    // const engineWatch = State.module.getStore("engine").watch;
    //
    //   console.log("SET MAP", this.engineState.state.actors);
    //
    watch("rotation", () => {
      this.requestUpdate();
      // this.update(this.template());
      // input.value = store.state.rotation[0];
    });
    //
    //   watch("name", () => {
    //     this.update(this.template());
    //   });
    //
    watch("number", () => {
      this._number = store.state.number;
    });
    //
    //   watch("data", () => {
    //     console.log("DATA", store.state.data);
    //     this.update(this.template());
    //   });
    //
    engineWatch(
      "actors",
      (a) => {
        // debugger;
        console.log("ACTORS SET MAP", engineStore.state.actors);
        this.actors = engineStore.state.actors;
        //this.engineState.state.actors._components.map((c) => console.log(c));
        // this.update();
      },
      {
        immediate: true,
      },
    );
  }

  onRoationChange(e) {
    const input = this.shadowRoot?.querySelector("#input") as HTMLInputElement;
    store.state.rotation[0] = e.target.value;
    input.value = e.target.value;
    store.state.camera.updateCameraMatrix();
    store.state.data.first = e.target.value;
  }
}
