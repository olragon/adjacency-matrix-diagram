<template>
    <g>
        <circle :r="r" :cx="cx" :cy="cy" @click="handleClick"></circle>
    </g>
</template>

<script>
    export default {
        props: {
            cx: { type: Number, default: 30/Math.SQRT2/2 },
            cy: { type: Number, default: 30/Math.SQRT2/2 },
            r: { type: Number, default: 8 },
            click: { type: Function, default: () => {} }
        },
        methods: {
            handleClick() {
                this.$emit('click');
            }
        }
    }
</script>
