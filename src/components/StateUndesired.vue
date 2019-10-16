<template>
    <g>
        <line :x1="x1" :y1="y1" :x2="x2" :y2="y2"></line>
    </g>
</template>

<style scoped>
    line {
        fill: #fff;
        stroke: #000;
    }
</style>

<script>
    export default {
        props: {
            x1: { default: 15 * Math.SQRT2 },
            y1: { default: 0 },
            x2: { default: 0 },
            y2: { default: 15 * Math.SQRT2 },
            click: { type: Function, default: () => {} }
        },
        methods: {
            handleClick() {
                this.$emit('click');
            }
        }        
    }
</script>