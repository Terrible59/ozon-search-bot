import puppeteer from 'puppeteer';
import { newInjectedPage } from 'fingerprint-injector';

import {CONST} from './constants.js';

(async (query) => {
    const browser = await puppeteer.launch({
        headless: false,
    });

    const page = await newInjectedPage(
        browser,
        {
            // мобильная версия - самый простой способ обхода antibot системы озона
            // она не отличается по функционалу от ПК версии, поэтому счёл такой вариант хорошим
            fingerprintOptions: {
                devices: ["mobile"],
                locales: ['ru-RU'],
                operatingSystems: ["ios"]
            },
        },
    );

    await page.goto('https://ozon.ru/');

    // тут сделал массив селекторов, так как там два элемента поиска, второй открывается при клике
    // на первый

    await page.waitForSelector(CONST.SELECTORS.SEARCH_INPUT[0], {timeout: CONST.WAIT_TIMEOUT});

    await page.click(CONST.SELECTORS.SEARCH_INPUT[0]);

    await page.waitForSelector(CONST.SELECTORS.SEARCH_INPUT[1], {timeout: CONST.WAIT_TIMEOUT});

    await page.click(CONST.SELECTORS.SEARCH_INPUT[1]);

    // тут я по букве ввожу запрос в обратном порядке, потому что 
    // при вбивании каждой из букв, озон перегружает страничку
    // и каретка на инпуте убегает в самое начало
    // проще было бы сразу переходить по такой ссылке: 
    // https://www.ozon.ru/modal/search-bar/search/?text=свитер
    // но раз дали задачу напечатать, решил сделать так
    for (let letter of query.split("").reverse().join("")) {
        await page.waitForSelector(CONST.SELECTORS.SEARCH_INPUT[1], {timeout: CONST.WAIT_TIMEOUT});
        await page.type(CONST.SELECTORS.SEARCH_INPUT[1], letter, {delay: CONST.TYPE_DELAY});
        await page.waitForNavigation();
    }

    await page.type(CONST.SELECTORS.SEARCH_INPUT[1], String.fromCharCode(13));

    await page.waitForSelector(CONST.SELECTORS.SEARCH_RESULT_LINKS[0], {timeout: CONST.WAIT_TIMEOUT});

    // плавная прокрутка
    for (let i = 0; i < 1000; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, 2);
        });
        await page.waitForTimeout(5); 
    }

    const searchResultLinkElements = await page.$$(CONST.SELECTORS.SEARCH_RESULT_LINKS[0]);
    searchResultLinkElements[11].click();

    await page.waitForTimeout(5000);

    for (let i = 0; i < 200; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, 2);
        });
        await page.waitForTimeout(10); 
    }

    await page.screenshot({path: `./screenshots/${(new Date()).toISOString().split('.')[0]}.jpg`})

    await page.waitForTimeout(5000);

    await browser.close();
})("свитер");