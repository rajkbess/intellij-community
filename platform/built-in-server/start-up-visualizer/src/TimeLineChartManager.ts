// Copyright 2000-2019 JetBrains s.r.o. Use of this source code is governed by the Apache 2.0 license that can be found in the LICENSE file.
import {InputData, Item, XYChartManager} from "./core"
import * as am4charts from "@amcharts/amcharts4/charts"
import * as am4core from "@amcharts/amcharts4/core"

// https://github.com/almende/vis/blob/master/examples/timeline/dataHandling/dataSerialization.html
// do not group because it makes hard to understand results
// (executed sequentially, so, we need to see it sequentially from left to right)
const isCreateGroups = false
const groups = isCreateGroups ? [
  {id: "application components"},
  {id: "project components"},
] : null

export class TimelineChartManager extends XYChartManager {
  constructor(container: HTMLElement) {
    super(container)

    const chart = this.chart

    this.configureDurationAxis()
    const levelAxis = this.configureLevelAxis()
    this.configureSeries()
    this.addHeightAdjuster(levelAxis)
  }

  private configureLevelAxis() {
    const levelAxis = this.chart.yAxes.push(new am4charts.CategoryAxis())
    levelAxis.dataFields.category = "rowIndex"
    levelAxis.renderer.grid.template.location = 0
    levelAxis.renderer.minGridDistance = 1
    levelAxis.renderer.labels.template.disabled = true
    return levelAxis
  }

  private configureDurationAxis() {
    const durationAxis = this.chart.xAxes.push(new am4charts.DurationAxis())
    durationAxis.durationFormatter.baseUnit = "millisecond"
    durationAxis.durationFormatter.durationFormat = "S"
    durationAxis.min = 0
    durationAxis.strictMinMax = true
    // durationAxis.renderer.grid.template.disabled = true
  }

  private configureSeries() {
    const series = this.chart.series.push(new am4charts.ColumnSeries())
    // series.columns.template.width = am4core.percent(80)
    series.columns.template.tooltipText = "{name}: {duration}\nlevel: {level}"
    series.dataFields.openDateX = "start"
    series.dataFields.openValueX = "start"
    series.dataFields.dateX = "end"
    series.dataFields.valueX = "end"
    series.dataFields.categoryY = "rowIndex"

    series.columns.template.propertyFields.fill = "color"
    series.columns.template.propertyFields.stroke = "color"
    // series.columns.template.strokeOpacity = 1

    const valueLabel = series.bullets.push(new am4charts.LabelBullet())
    valueLabel.label.text = "{name}"
    valueLabel.label.truncate = false
    valueLabel.label.hideOversized = false
    valueLabel.label.horizontalCenter = "left"
    // valueLabel.label.fill = am4core.color("#fff")
    valueLabel.locationX = 1
    // https://github.com/amcharts/amcharts4/issues/668#issuecomment-446655416
    valueLabel.interactionsEnabled = false
    // valueLabel.label.fontSize = 12
  }

  private addHeightAdjuster(levelAxis: am4charts.Axis) {
    // https://www.amcharts.com/docs/v4/tutorials/auto-adjusting-chart-height-based-on-a-number-of-data-items/
    // noinspection SpellCheckingInspection
    this.chart.events.on("datavalidated", () => {
      const chart = this.chart
      const adjustHeight = chart.data.reduce((max, item) => Math.max(item.rowIndex, max), 0) * 35 - levelAxis.pixelHeight

      // get current chart height
      let targetHeight = chart.pixelHeight + adjustHeight

      // Set it on chart's container
      chart.svgContainer!!.htmlElement.style.height = targetHeight + "px"
    })
  }

  render(ijData: InputData) {
    const items = ijData.items
    const firstStart = new Date(items[0].start)
    const timeOffset = items[0].start

    const data = transformIjData(ijData, timeOffset)
    this.chart.data = data

    const originalItems = items
    const durationAxis = this.chart.xAxes.getIndex(0) as am4charts.DurationAxis
    durationAxis.max = originalItems[originalItems.length - 1].end - timeOffset
  }
}

function computeLevels(items: Array<Item>) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    let level = 0
    for (let j = i - 1; j >= 0; j--) {
      const prevItem = items[j] as TimeLineItem
      if (prevItem.end >= item.end) {
        level = prevItem.level + 1
        break
      }
    }

    (item as TimeLineItem).level = level
  }
}

function transformIjData(input: InputData, timeOffset: number): Array<any> {
  const colorSet = new am4core.ColorSet()
  const transformedItems = new Array<any>(input.items.length)
  computeLevels(input.items)

  // we cannot use actual level as row index because in this case labels will be overlapped, so,
  // row index simply incremented till empirical limit (6).
  let rowIndex = 0
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i] as TimeLineItem
    const result: any = {
      name: item.name,
      start: item.start - timeOffset,
      end: item.end - timeOffset,
      duration: item.duration,
      // level: item.isSubItem ? 2 : 1
      // level: "l" + getLevel(i, input.items, transformedItems).toString(),
      // level: getLevel(i, input.items, transformedItems),
      // level: item.level,
      rowIndex: rowIndex++,
      color: colorSet.getIndex(item.level),
      level: item.level,
    }

    if (rowIndex > 6) {
      rowIndex = 0
    }
    transformedItems[i] = result
  }

  transformedItems.sort((a, b) => a.rowIndex - b.rowIndex)
  return transformedItems
}

interface TimeLineItem extends Item {
  level: number
  rowIndex: number
}