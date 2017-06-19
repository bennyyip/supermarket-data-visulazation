(function (d3) {
  'use strict'
  // const [[[1
  //SVG的宽度和高度
  const W = 1000
  const H = 600

  const colorsPositive = d3.scaleQuantize().range([
    '#BBDEFB', '#90CAF9', '#64B5F6',
    '#42A5F5', '#2196F3', '#1E88E5'
  ])

  const colorsNegative = d3.scaleQuantize().range([
    '#D32F2F', '#E53935', '#F44336',
    '#EF5350', '#E57373', '#EF9A9A'
  ])

  Number.prototype.formatMoney = function(c, d, t){
    var n = this,
      c = isNaN(c = Math.abs(c)) ? 2 : c,
      d = d == undefined ? "." : d,
      t = t == undefined ? "," : t,
      s = n < 0 ? "-" : "",
      i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
      j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  };

  var ELEMENTS = {
    slider: document.querySelector('#year-slider'),
    sliderLabel: document.querySelector('#year-slider-label')
  }

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(state) {
      if (!!state.properties.profit) {
        var color =  state.properties.profit>= 0?'#5fba7d':'red';
        return "<strong style='color:orange'>State:</strong> <span>" + state.properties.name + "</span>" +  "</br><strong style='color:orange'>Profit:</strong> <span style='color:"+color+"'>" + state.properties.profit.formatMoney() + "</span>"
      } else {
        return 'no data'
      }
    })

  // utils [[[1
  // load data [[[2
  function loadJSON(url) {
    return new Promise((resolve, reject) => {
      d3.json(url, (err, data) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  function loadCSV(url) {
    return new Promise((resolve, reject) => {
      d3.csv(url, (err, data) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
  // process data [[[2
  function processData(orders) {
    var result = {}
    orders.forEach(order => {
      var ref = order['OrderDate'].split('/').map(Number)
      var month = ref[1]
      var year = ref[0]

      var state = order['State']
      var profit = parseFloat(order['Profit'])

      if (!result[year]) { result[year] = {} }
      if (!result[year][state]) {
        result[year][state] = {
          profit: 0
        }
      }
      result[year][state].profit += profit
    })
    return result
  }
  // US Map [[[1
  var USMap = function USMap(usstate) {

    var projection = d3.geoPath()
      .projection(d3.geoAlbersUsa().translate([W / 2, H / 2]).scale([1000]))

    //创建SVG元素
    var svg = d3.select("body")
      .append("svg")
      .attr("width", W)
      .attr("height", H)
    svg.call(tip)


    // 生成州
    var pathes = svg.selectAll('path').data(usstate.features).enter().append('path').attr('d', projection).attr('class', 'state')
    this.pathes = pathes
    pathes
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)

  }
  // Data Viewer [[[1
  var DataViewer = function DataViewer(orders, pathes, year) {
    this.selectedState = null
    this.orders = orders
    this.pathes = pathes
    this.setYear(year)
  }

  DataViewer.prototype.setYear = function setYear(year) {
    if (!!this.orders[year]) {
      this.year = year

      // 计算最大/最小利润
      var orders = this.orders[year]
      this.maxProfit = d3.max(Object.keys(orders), state => orders[state].profit)
      this.minProfit = d3.min(Object.keys(orders), state => orders[state].profit)
      this.updateColor()
    }
  }
  DataViewer.prototype.updateColor = function updateColor() {
    var profits = this.orders[this.year]

    colorsPositive.domain([0, this.maxProfit])
    colorsNegative.domain([this.minProfit, 0])

    this.pathes.style('fill', function (state) {
      var s = profits[state.properties.name]
      if (!!s) {
        var profit = s.profit
        state.properties.profit = profit
        if (profit > 0) { return colorsPositive(profit) }
        if (profit < 0) { return colorsNegative(profit) }
      }
      return '#ccc'
    })
  }
  // main [[[1
  Promise.all([
    loadJSON('data/us-states.json'),
    loadCSV('data/superstore-subset.csv')
  ]).then(function (ref) {
    var usstate = ref[0]
    var rawOrders = ref[1]

    var orders = processData(rawOrders)
    var usMap = new USMap(usstate)
    var dataViewer = new DataViewer(orders, usMap.pathes, 2010)

    // update map when slider is changed
    ELEMENTS.slider.onchange=((e)=>{
      var year = e.target.value
      ELEMENTS.sliderLabel.innerText= year
      dataViewer.setYear(year)
    })

  })
}(d3))
// vim modeline [[[1
// vim:fdm=marker:fmr=[[[,]]]
