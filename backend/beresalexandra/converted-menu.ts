import * as R from 'ramda'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import dayjs from 'dayjs'

import {startOfWeek, getTextForFoodTypeForWeek, convertBeresalexandraToFoodData} from './utils/conversion'
import {Course, FoodData} from '../domain'
import {fozelekSelectorsForTheWeek} from './food-types/fozelek'
import {mainCourseSelectorsForTheWeek} from './food-types/main-course'


export function loadSite(body: string | Buffer): CheerioStatic {
  return cheerio.load(body)
}

export function currentSiteMenu() {
  return rawSiteContent('aktualis_etlap')
    .then(loadSite)
    .then(menu)
}

export function nextSiteMenu() {
  return rawSiteContent('kovetkezo_etlap')
    .then(loadSite)
    .then(menu)
}

export async function menu($: CheerioStatic): Promise<FoodData[]> {
  return [...fozelek($), ...mainCourse($)].filter(Boolean)
}

export function processRawTextOfFoodTypeForTheWeek($, selectors: string[][], type: Course): FoodData[] {
  const addDaysToStartOfTheWeek = addDaysToDate(startOfWeek($))
  return getTextForFoodTypeForWeek($, selectors)
    .map((dailyFoods, dayOfTheWeek) => 
      dailyFoods.map(dailyFood => 
        convertBeresalexandraToFoodData(dailyFood, type, addDaysToStartOfTheWeek(dayOfTheWeek))))
    .flat(Infinity)
}

export function fozelek($: CheerioStatic): FoodData[] {
  return processRawTextOfFoodTypeForTheWeek($, fozelekSelectorsForTheWeek(), Course.Fozelek)
}

export function mainCourse($: CheerioStatic): FoodData[] {
  return processRawTextOfFoodTypeForTheWeek($, mainCourseSelectorsForTheWeek(), Course.MainCourse)
}

function rawSiteContent(currentOrNextPath) {
  return fetch(`https://www.beresalexandra.hu/${currentOrNextPath}/nyomtatas`)
    .then(res => res.text())
}

function addDaysToDate(date: Date) {
  return daysToAdd => dayjs(date)
    .add(daysToAdd, 'day')
    .toDate()
}
