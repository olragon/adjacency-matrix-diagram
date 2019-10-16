import Vue from 'vue'
import AdjacencyMaxtrix from './components/AdjacencyMaxtrix.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(AdjacencyMaxtrix)
}).$mount('#app')
