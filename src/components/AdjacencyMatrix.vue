<template>
    <div id="app-inner">
        <h3>Interior Design / Adjacency Matrix Diagram Editor</h3>

        <div id="editor-wrap">
            <div id="editor-outer" class="row">
                <div id="editor" class="haft">
                    <textarea cols="30" rows="8" v-model="rawRooms"></textarea>
                    <p class="description">
                        - Input your room list, one room one line.<br />
                        - Your work will be auto saved in your local browser or
                        you can download state file and load later.<br />
                        - You want to read
                        <a
                            href="https://carolynjeanmatthews.com/2017/02/07/adjacency-matrix-decoded/"
                            >ADJACENCY MATRIX DECODED</a
                        >
                        by Carolyn Jean Matthews<br />
                        -
                        <a
                            href="https://github.com/olragon/adjacency-matrix-diagram"
                            >Open source</a
                        >
                    </p>

                    <div>
                        <label>
                            <input type="color" v-model="inactiveTextColor" />
                            Inactive text color
                        </label>

                        <label>
                            <input type="color" v-model="activeTextColor" />
                            Active text color
                        </label>
                    </div>

                    <div>
                        <button @click.prevent="loadSamples">
                            Need a sample?
                        </button>
                    </div>

                    <div>
                        <button
                            v-if="rooms.length > 0"
                            @click.prevent="downloadSvg"
                        >
                            Download SVG image
                        </button>
                        <button
                            v-if="rooms.length > 0"
                            @click.prevent="downloadState"
                        >
                            Download current state
                        </button>
                    </div>

                    <div>
                        <label
                            >Load saved state
                            <input
                                type="file"
                                id="file"
                                @change="handleStateFile"
                        /></label>
                    </div>
                </div>

                <div id="diagram" class="haft">
                    <svg
                        :width="svgSize.width"
                        :height="svgSize.height"
                        id="svg-image"
                    >
                        <g
                            v-for="(r, ri) in modelRooms"
                            :key="'room-' + ri"
                            :transform="r.g.transform"
                            class="room-wrap"
                            :class="{ active: isActive({ r, ri }) }"
                        >
                            <line
                                :x1="r.l1.x1"
                                :y1="r.l1.y1"
                                :x2="r.l1.x2"
                                :y2="r.l1.y2"
                                class="line"
                            />
                            <text
                                :y="height / 2 + 5"
                                :style="{
                                    fill: isActive({ r, ri })
                                        ? activeTextColor
                                        : inactiveTextColor,
                                }"
                            >
                                <tspan>{{ r.name }}</tspan>
                            </text>
                            <line
                                v-if="r.l2"
                                :x1="r.l2.x1"
                                :y1="r.l2.y1"
                                :x2="r.l2.x2"
                                :y2="r.l2.y2"
                                class="line"
                            />
                        </g>

                        <g
                            v-for="(r, ri) in modelRects"
                            :key="`cell-${ri}`"
                            :transform="r.g.transform"
                            class="rect-wrap"
                            @mouseover="handleMouseOverRect({ r, ri })"
                            @mouseout="handleMouseOutRect({ r, ri })"
                            style="pointer-events: bounding-box"
                            @click="changeState({ r, ri })"
                        >
                            <rect
                                :x="r.rect.x"
                                :y="r.rect.y"
                                :width="r.rect.width"
                                :height="r.rect.height"
                                class="rect"
                            ></rect>
                            <StatePrimary v-if="r.state === 'Primary'" />
                            <StateSecondary v-if="r.state === 'Secondary'" />
                            <StateUndesired v-if="r.state === 'Undesired'" />
                        </g>

                        <g
                            :transform="`translate(${
                                length * baseLengthUnit +
                                rooms.length * baseLengthUnit +
                                3 * baseLengthUnit
                            }, 0)`"
                        >
                            <g transform="translate(0,0)">
                                <StatePrimary />
                                <text :x="30" :y="15">
                                    <tspan>Primary Adjacency</tspan>
                                </text>
                            </g>
                            <g transform="translate(0,30)">
                                <text :x="30" :y="15">
                                    <tspan>Secondary Adjacency</tspan>
                                </text>
                                <StateSecondary />
                            </g>
                            <g transform="translate(0,60)">
                                <text :x="30" :y="15">
                                    <tspan>Undesired Adjacency</tspan>
                                </text>
                                <line
                                    :x1="0"
                                    :y1="15 / 2"
                                    :x2="30 / Math.SQRT2"
                                    :y2="15 / 2"
                                    class="line"
                                ></line>
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.room-wrap text {
    fill: #cacaca;
}

.line {
    stroke: #000;
    stroke-width: 1px;
}

.triangle {
    stroke: black;
    fill: white;
}

.rect {
    fill: #fff;
    stroke: black;
    cursor: pointer;
}

.active text {
    fill: #000;
}

.row {
    display: flex;
}

.haft {
    width: 50%;
    padding: 5px;
}

#editor textarea {
    width: 100%;
}

svg {
    width: 100%;
}
</style>

<script>
import StatePrimary from "./StatePrimary.vue";
import StateSecondary from "./StateSecondary.vue";
import StateUndesired from "./StateUndesired.vue";

export default {
    components: {
        StatePrimary,
        StateSecondary,
        StateUndesired,
    },
    data() {
        return {
            allStates: ["Primary", "Secondary", "Undesired", ""],
            height: 30,
            baseLengthUnit: 10,
            rooms: [],
            states: {},
            currentRooms: [],
            rawRooms: "",
            inactiveTextColor: "#cacaca",
            activeTextColor: "#000000",
        };
    },
    computed: {
        length() {
            if (this.rooms.length <= 0) return 0;
            let rooms = this.rooms
                .slice()
                .sort((a, b) => b.name.length - a.name.length);
            return rooms[0].name.length;
        },
        modelRooms() {
            return this.rooms.map((r, ri) => {
                let isLast = ri === this.rooms.length - 1;
                r.g = {
                    transform: `translate(0,${this.height * ri})`,
                };
                r.l1 = {
                    x1: 0,
                    y1: 0,
                    x2: this.length * this.baseLengthUnit,
                    y2: 0,
                };
                if (isLast) {
                    r.l2 = {
                        x1: 0,
                        y1: this.height,
                        x2: this.length * this.baseLengthUnit,
                        y2: this.height,
                    };
                }
                return r;
            });
        },
        modelRects() {
            let numLayers = this.rooms.length - 1;
            let rectHeight = this.height / Math.SQRT2;
            let rects = [];
            for (let _i = 0; _i < numLayers; _i++) {
                for (let _j = 0; _j < numLayers - _i; _j++) {
                    let gx =
                        this.length * this.baseLengthUnit +
                        this.height / 2 +
                        (_j * this.height) / 2;
                    let gy =
                        _i * this.height +
                        this.height / 2 +
                        (_j * this.height) / 2;
                    let rect = {
                        from: this.rooms[_i],
                        to: this.rooms[_j + _i + 1],
                        g: {
                            transform: `translate(${gx},${gy}) rotate(45 0 0)`,
                        },
                        rect: {
                            x: 0,
                            y: 0,
                            width: rectHeight,
                            height: rectHeight,
                        },
                        gx,
                        gy,
                    };
                    let stateKey = `${rect.from.name}-${rect.to.name}`;
                    if (this.states[stateKey]) {
                        rect.state = this.states[stateKey];
                    }
                    rects.push(rect);
                }
            }
            return rects;
        },
        canStore() {
            return storageAvailable("localStorage");
        },
        appState() {
            return {
                states: this.states,
                rawRooms: this.rawRooms,
                inactiveTextColor: this.inactiveTextColor,
                activeTextColor: this.activeTextColor,
            };
        },
        svgSize() {
            const rects = this.modelRects || [];
            if (rects.length === 0) {
                return { width: 0, height: 0 };
            }
            const width = Math.max(...rects.map((r) => r.gx || 0)) + 50;
            const height = Math.max(...rects.map((r) => r.gy || 0)) + 50;
            return { width, height };
        },
    },
    created() {
        this.loadState();
    },
    watch: {
        rawRooms(val) {
            if (val) {
                this.rooms = val
                    .trim()
                    .split("\n")
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((txt) => {
                        return {
                            name: txt.trim(),
                        };
                    });
                this.saveState();
            } else {
                this.rooms = [];
            }
        },
    },
    methods: {
        loadSamples() {
            this.rawRooms = `Entry Foyer\nDinning Room\nMaster Bedroom\nLiving Room\nMaster Bathroom`;
            this.states = {};
        },
        changeState({ r }) {
            let key = `${r.from.name}-${r.to.name}`;
            let state = this.allStates[0];
            console.log(`changeState: ${key} ${state}`);
            if (this.states[key]) {
                let curStateIndex = this.allStates.indexOf(this.states[key]);
                let nextStateIndex =
                    curStateIndex < this.allStates.length - 1
                        ? curStateIndex + 1
                        : 0;
                state = this.allStates[nextStateIndex];
            }
            this.states[key] = state;
            this.saveState();
        },
        handleMouseOverRect({ r }) {
            this.currentRooms = [r.from.name, r.to.name];
        },
        isActive({ r }) {
            return this.currentRooms && this.currentRooms.includes(r.name);
        },
        handleMouseOutRect() {
            this.currentRooms = [];
        },
        saveState() {
            if (this.canStore) {
                window.localStorage.setItem(
                    "appState",
                    JSON.stringify(this.appState)
                );
            }
        },
        loadState(rawState) {
            if (!rawState && this.canStore) {
                rawState = window.localStorage.getItem("appState");
            }
            if (rawState) {
                try {
                    let savedState = JSON.parse(rawState);
                    this.rawRooms = savedState.rawRooms;
                    Object.keys(savedState.states).forEach((k) => {
                        this.states[k] = savedState.states[k];
                    });
                } catch (err) {
                    alert("Cannot load saved state");
                }
            }
        },
        createDownloadLink(data, fileName) {
            let linkEl = document.createElement("a");
            linkEl.setAttribute("href", data);
            linkEl.setAttribute("download", fileName);
            return linkEl;
        },
        downloadState() {
            let stateTxt =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(this.appState));
            let linkEl = this.createDownloadLink(
                stateTxt,
                "adjacency-matrix-diagram.json"
            );
            linkEl.click();
            linkEl.remove();
        },
        handleStateFile(evt) {
            let input = evt.target;
            if (input.files.length === 0) {
                return alert(
                    "Error! You must select adjacency-matrix-diagram JSON state file."
                );
            }
            if (!input.files[0].type.match(/json/)) {
                return alert("Error! It's not JSON file.");
            }
            let vm = this;
            let reader = new FileReader();
            reader.onload = function () {
                let text = reader.result;
                vm.loadState(text);
                alert("Success! State loaded.");
                input.value = "";
            };
            reader.readAsText(input.files[0]);
        },
        downloadSvg() {
            let svg = document.getElementById("svg-image");
            let serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);
            if (
                !source.match(
                    /^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/
                )
            ) {
                source = source.replace(
                    /^<svg/,
                    '<svg xmlns="http://www.w3.org/2000/svg"'
                );
            }
            if (
                !source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)
            ) {
                source = source.replace(
                    /^<svg/,
                    '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
                );
            }
            // add css
            source = source.replace(
                /id="svg-image">/,
                'id="svg-image"><style>circle.state-primary{fill:#000;stroke:#000}circle.state-secondary{fill:#fff;stroke:#000}line{fill:#fff;stroke:#000}.room-wrap text{fill:#cacaca}.line{stroke:#000;stroke-width:1px}.triangle{stroke:#000;fill:#fff}.rect{fill:#fff;stroke:#000;cursor:pointer}.active text{fill:#000}.row{display:-webkit-box;display:-ms-flexbox;display:flex}.haft{width:50%;padding:5px}#editor textarea{width:100%}svg{width:100%}</style>'
            );
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            source =
                "data:text/xml;charset=utf-8," + encodeURIComponent(source);
            let linkEl = this.createDownloadLink(
                source,
                "adjacency-matrix-diagram.svg"
            );
            linkEl.click();
            linkEl.remove();
        },
    },
};

function storageAvailable(type) {
    try {
        var storage = window[type],
            x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0
        );
    }
}
</script>
