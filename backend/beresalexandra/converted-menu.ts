import * as R from 'ramda'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import {flatten} from 'ramda'

import {startOfWeek, getTextForFoodTypeForWeek, convertToFoodData} from './utils/conversion'
import {FoodType} from './utils/food-type'
import {FoodData} from './utils/food-data'
import {fozelekSelectorsForTheWeek} from './food-types/fozelek'
import {mainCourseSelectorsForTheWeek} from './food-types/main-course'


export function loadSite(body: string | Buffer): CheerioStatic {
  return cheerio.load(body)
}

export function siteMenu() {
  return rawSiteContent('aktualis_etlap')
    .then(loadSite)
    .then(menu)
}

export function nextSiteMenu() {
  return rawSiteContent('kovetkezo_etlap')
    .then(loadSite)
    .then(menu)
}

export async function menu($: CheerioStatic) {
  return [...fozelek($), ...mainCourse($)].filter(Boolean)
}

export function processRawTextOfFoodTypeForTheWeek($, selectors: string[][], type: FoodType): FoodData[] {
  const addDaysToStartOfTheWeek = R.curry(addDaysToDate)(startOfWeek($))
  return flatten(
    getTextForFoodTypeForWeek($, selectors)
      .map((dailyFoods, dayOfTheWeek) => convertTypeForDay(dailyFoods, dayOfTheWeek)),
  )

  function convertTypeForDay(dailyFoods: string[], dayOfTheWeek: number): FoodData[] {
    return dailyFoods.map(dailyFood => convertToFoodData(dailyFood, type, addDaysToStartOfTheWeek(dayOfTheWeek)))
  }
}

export function fozelek($: CheerioStatic): FoodData[] {
  return processRawTextOfFoodTypeForTheWeek($, fozelekSelectorsForTheWeek(), FoodType.Fozelek)
}

export function mainCourse($: CheerioStatic): FoodData[] {
  return processRawTextOfFoodTypeForTheWeek($, mainCourseSelectorsForTheWeek(), FoodType.MainCourse)
}

function rawSiteContent(currentOrNextPath) {
  return fetch(`https://www.beresalexandra.hu/${currentOrNextPath}/nyomtatas`)
    .then(res => res.text())
}

function addDaysToDate(date: Date, days: number): Date {
  const nextDate = new Date(date.valueOf())
  nextDate.setDate(date.getDate() + days)
  return nextDate
}
