"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualSyncCharlestonWrap = exports.syncCharlestonWrapData = exports.CharlestonWrapService = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const puppeteer_1 = require("puppeteer");
const cheerio = require("cheerio");
/**
 * Charleston Wrap Scraper Service
 * Logs into Charleston Wrap portal and extracts fundraising data
 */
class CharlestonWrapService {
    constructor() {
        this.loginUrl = 'https://midas.charlestonwrap.com/scripts/cwcaws.exe/';
    }
    /**
     * Scrape Charleston Wrap portal for fundraising data
     */
    async scrapeFundraisingData(username, password) {
        let browser = null;
        try {
            functions.logger.info('Starting Charleston Wrap data scrape');
            // Launch headless browser
            browser = await puppeteer_1.default.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ],
            });
            const page = await browser.newPage();
            // Navigate to login page
            await page.goto(this.loginUrl, { waitUntil: 'networkidle2' });
            // Fill in login form
            await page.type('input[name="userName"]', username);
            await page.type('input[name="password"]', password);
            // Click login button
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.click('button:has-text("Login")'),
            ]);
            // Wait for dashboard to load
            await page.waitForSelector('body', { timeout: 10000 });
            // Get page content
            const content = await page.content();
            const $ = cheerio.load(content);
            // Extract data from the page
            const data = this.parseCharlestonWrapData($);
            functions.logger.info('Successfully scraped Charleston Wrap data', {
                customerNumber: data.customerNumber,
                totalRetail: data.totalRetail,
            });
            return data;
        }
        catch (error) {
            functions.logger.error('Error scraping Charleston Wrap data:', error);
            throw error;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    /**
     * Parse Charleston Wrap dashboard HTML
     */
    parseCharlestonWrapData($) {
        // Extract customer number
        const customerNumber = this.extractText($, 'Customer Number:');
        // Extract organization name (from the page heading)
        const organizationName = $('div').filter((i, el) => {
            return $(el).text().includes('St Francis Cub Scout Pack');
        }).first().text().split('\n')[0].trim();
        // Extract campaign
        const campaign = this.extractText($, 'Fall 2025');
        // Extract sales data
        const totalRetailText = this.extractText($, 'Total Current Retail');
        const totalRetail = this.parseMoneyValue(totalRetailText);
        const totalItemsText = this.extractText($, 'Total Items Sold');
        const totalItemsSold = parseInt(totalItemsText.replace(/\D/g, '')) || 0;
        const totalProfitText = this.extractText($, 'Total Combined Profit Earned');
        const totalProfit = this.parseMoneyValue(totalProfitText);
        // Extract sale end date and calculate days remaining
        const saleEndText = this.extractText($, 'Sale Ends');
        const daysRemainingText = this.extractText($, 'Days');
        const daysRemaining = parseInt(daysRemainingText.replace(/\D/g, '')) || 0;
        // Extract fundraising goal
        const goalText = $('input[value*="$"]').first().val() || '$0';
        const fundraisingGoal = this.parseMoneyValue(goalText);
        // Extract goal statement
        const goalStatement = $('textarea').first().val() || '';
        // Extract sales rep info
        const salesRepName = this.extractText($, 'Sales Rep:');
        const salesRepPhone = this.extractText($, 'Sales Rep Phone:');
        const salesRepEmail = this.extractText($, 'Sales Rep Email:');
        // Extract chairperson info
        const chairpersonName = this.extractText($, 'Chairperson:');
        const chairpersonPhone = this.extractText($, 'Chairperson Phone:');
        const chairpersonEmail = this.extractText($, 'Chairperson Email:');
        return {
            customerNumber,
            organizationName,
            campaign,
            totalRetail,
            totalItemsSold,
            totalProfit,
            daysRemaining,
            saleEndDate: saleEndText,
            fundraisingGoal,
            goalStatement,
            salesRep: {
                name: salesRepName,
                phone: salesRepPhone,
                email: salesRepEmail,
            },
            chairperson: {
                name: chairpersonName,
                phone: chairpersonPhone,
                email: chairpersonEmail,
            },
            lastUpdated: admin.firestore.Timestamp.now(),
        };
    }
    /**
     * Extract text following a label
     */
    extractText($, label) {
        const element = $('div').filter((i, el) => {
            return $(el).text().includes(label);
        }).first();
        if (element.length === 0)
            return '';
        const text = element.text();
        const parts = text.split(label);
        return parts.length > 1 ? parts[1].trim().split('\n')[0].trim() : '';
    }
    /**
     * Parse money value from string (e.g., "$447.00" -> 447.00)
     */
    parseMoneyValue(text) {
        const cleaned = text.replace(/[$,]/g, '');
        const value = parseFloat(cleaned);
        return isNaN(value) ? 0 : value;
    }
    /**
     * Save fundraising data to Firestore
     */
    async saveFundraisingData(data) {
        const db = admin.firestore();
        await db.collection('fundraising').doc('current').set(Object.assign(Object.assign({}, data), { lastUpdated: admin.firestore.FieldValue.serverTimestamp() }));
        functions.logger.info('Saved fundraising data to Firestore');
    }
}
exports.CharlestonWrapService = CharlestonWrapService;
/**
 * Cloud Function: Sync Charleston Wrap data
 * Scheduled to run every hour
 */
exports.syncCharlestonWrapData = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
    try {
        functions.logger.info('Starting Charleston Wrap data sync');
        // Get credentials from Secret Manager
        const username = process.env.CHARLESTON_WRAP_USERNAME || '27150';
        const password = process.env.CHARLESTON_WRAP_PASSWORD || 'sh140n';
        const service = new CharlestonWrapService();
        const data = await service.scrapeFundraisingData(username, password);
        if (data) {
            await service.saveFundraisingData(data);
            functions.logger.info('Charleston Wrap data sync completed successfully');
        }
        else {
            functions.logger.warn('No data returned from Charleston Wrap');
        }
        return null;
    }
    catch (error) {
        functions.logger.error('Error in Charleston Wrap data sync:', error);
        throw error;
    }
});
/**
 * Manual trigger for Charleston Wrap data sync
 * Can be called via HTTP for testing
 */
exports.manualSyncCharlestonWrap = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated and has admin role
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can manually sync Charleston Wrap data');
    }
    try {
        const username = process.env.CHARLESTON_WRAP_USERNAME || '27150';
        const password = process.env.CHARLESTON_WRAP_PASSWORD || 'sh140n';
        const service = new CharlestonWrapService();
        const fundraisingData = await service.scrapeFundraisingData(username, password);
        if (fundraisingData) {
            await service.saveFundraisingData(fundraisingData);
            return {
                success: true,
                data: fundraisingData,
                message: 'Charleston Wrap data synced successfully',
            };
        }
        else {
            return {
                success: false,
                message: 'No data returned from Charleston Wrap',
            };
        }
    }
    catch (error) {
        functions.logger.error('Error in manual Charleston Wrap sync:', error);
        throw new functions.https.HttpsError('internal', 'Failed to sync Charleston Wrap data', error);
    }
});
//# sourceMappingURL=charlestonWrapService.js.map