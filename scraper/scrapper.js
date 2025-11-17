import puppeteer from 'puppeteer';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';

// Sleep utility compatible across Puppeteer versions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class Scraper {
  constructor(conf) { 
    this.conf = conf;
  }

  async initialize() {
    const userAgent = new UserAgent({ deviceCategory: "desktop" });
    // Use default puppeteer configuration without executablePath
    const puppeteerConfig = {
      headless: this.conf.puppeteerConfig.headless,
      args: this.conf.puppeteerConfig.args || []
    };
    
    this.browser = await puppeteer.launch(puppeteerConfig);
    this.page = await this.browser.newPage();
    this.page.setUserAgent(userAgent.toString())

    // Check if preload file exists before reading
    if (this.conf.puppeteerPreloadJs && this.conf.puppeteerPreloadJs[0] && fs.existsSync(this.conf.puppeteerPreloadJs[0])) {
      const preloadFile = fs.readFileSync(this.conf.puppeteerPreloadJs[0], { encoding: 'utf-8' });
      await this.page.evaluateOnNewDocument(preloadFile);
    }
    
    await this.page.setViewport(this.conf.puppeteerResolution)
    await this.page.setExtraHTTPHeaders(this.conf.puppeteerHttpHeaders)
  }

  async initializeTest() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
  }

  async navigateTo(url) {
    if (!this.page) throw new Error('Page is not initialized. Call initialize() first.');
    await this.page.goto(url);
  }

  async Scrap(debug = false, username, password) {
    try {
      await this.initialize();
      await this.navigateTo(this.conf.url);
      let data = {};
      this.page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/dsply.aspx')) {
          const text = await response.text();
          // Remove JSONP wrapper
          const jsonString = text.replace(/^jsonp_callback\(/, '').replace(/\);$/, '');
          // Parse the JSON string
          try {
            // Parse JSON response if applicable
            data = JSON.parse(jsonString)
          } catch (error) {
            try {
              // If not JSON, parse as text
              const textResponse = await response.text();
            } catch (innerError) {
              console.error('Failed to parse response:', innerError);
              throw innerError;
            }
          }
        }
      });
      // Wait for login button and perform login
      await this.page.waitForSelector('button[type="submit"][name="loginbttn"]', { timeout: 30000 });
      await this.page.type('#j_username', username);
      await this.page.type('#j_password', password);
      await this.page.click('button[type="submit"][name="loginbttn"]');
      await this.page.setDefaultNavigationTimeout(60000);

      // Give the dashboard a moment to load
      await sleep(2000);

      // Try multiple possible selectors for the credit report link
      const possibleReportLinkSelectors = [
        'a[href="/member/credit-report/smart-3b/"]',
        'a[href*="credit-report"]',
        'a[href*="smart-3b"]',
        'a[href*="/member/credit-report"]',
        'a[href*="/credit/report"]'
      ];

      let reportLinkFound = false;
      let reportLinkSelector = null;

      for (const selector of possibleReportLinkSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 10000 });
          reportLinkSelector = selector;
          reportLinkFound = true;
          break;
        } catch (e) {
          // continue to next selector
        }
      }

      // If not found by selector, try scanning all links by text/href
      if (!reportLinkFound) {
        const clicked = await this.page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const match = links.find(link => {
            const text = (link.textContent || '').toLowerCase();
            const href = (link.getAttribute('href') || '').toLowerCase();
            return /credit report|view report|my report/.test(text) || /credit-report|smart-3b/.test(href);
          });
          if (match) {
            match.click();
            return true;
          }
          return false;
        });
        reportLinkFound = clicked;
      }

      if (!reportLinkFound) {
        // Capture debugging artifacts
        const dashboardScreenshotPath = './dashboard-page-screenshot.png';
        await this.page.screenshot({ path: dashboardScreenshotPath, fullPage: true });
        const dashboardHtml = await this.page.content();
        fs.writeFileSync('./dashboard-page.html', dashboardHtml);
        throw new Error('Could not find credit report link');
      }

      // Click using selector when available
      if (reportLinkSelector) {
        await this.page.evaluate((selector) => {
          const link = document.querySelector(selector);
          if (link) link.click();
        }, reportLinkSelector);
      }

      // Try multiple possible selectors for the report container and do not hard-fail
      const possibleReportContainerSelectors = [
        '.report-container',
        '#report-container',
        '.credit-report',
        '#credit-report',
        '.report-data',
        '.report-content',
        '.report'
      ];

      let reportContainerFound = false;
      for (const selector of possibleReportContainerSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 10000 });
          reportContainerFound = true;
          break;
        } catch (e) {
          // continue to next selector
        }
      }

      // Even if the container isn’t found, continue and try extracting data
      await sleep(10000);

      // Take a screenshot for debugging
      const screenshotPath = './credit-report-screenshot.png';
      await this.page.screenshot({ path: screenshotPath, fullPage: true });

      // If no data was captured from the response, try extracting from the page
      if (!data || Object.keys(data).length === 0) {
        try {
          const html = await this.page.content();
          fs.writeFileSync('./credit-report-page.html', html);

          // Try evaluations from config if available
          if (this.conf && this.conf.evaluations) {
            try {
              const stateData = await this.page.evaluate((evalString) => {
                try {
                  return Function('return ' + evalString)();
                } catch (e) {
                  return null;
                }
              }, this.conf.evaluations.get_state_data);
              if (stateData) data = stateData;
            } catch (e) {
              // ignore evaluation errors
            }
            if (!data || Object.keys(data).length === 0) {
              try {
                const ceoData = await this.page.evaluate((evalString) => {
                  try {
                    return Function('return ' + evalString)();
                  } catch (e) {
                    return null;
                  }
                }, this.conf.evaluations.get_ceo_info);
                if (ceoData) data = ceoData;
              } catch (e) {
                // ignore evaluation errors
              }
            }
          }

          // If still empty, try to extract JSON from script tags
          if (!data || Object.keys(data).length === 0) {
            data = await this.page.evaluate(() => {
              const scripts = Array.from(document.querySelectorAll('script'));
              for (const script of scripts) {
                const content = script.textContent || '';
                if (content.includes('BundleComponents') || content.includes('TrueLinkCreditReportType')) {
                  try {
                    const match = content.match(/\{[\s\S]*\}/);
                    if (match) {
                      return JSON.parse(match[0]);
                    }
                  } catch (e) {
                    // continue
                  }
                }
              }
              if (window.hasOwnProperty('creditReportData') || window.hasOwnProperty('reportData')) {
                return window.creditReportData || window.reportData;
              }
              return {};
            });
          }
        } catch (extractionError) {
          // continue even if extraction fails, Parse will handle empty data
        }
      }

      return this.Parse(data)
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      if (!debug) this.close();
    }
  }

  async Parse(credit_report) {
    try {
      let modifiedReport = {};
      let original_report = (credit_report.hasOwnProperty('BundleComponents'))
        ? credit_report['BundleComponents']['BundleComponent'] : undefined

      let bureau = {
        'TUC': { id: 1, name: 'TransUnion', symbol: 'TUC' },
        'EXP': { id: 2, name: 'Experian', symbol: 'EXP' },
        'EQF': { id: 3, name: 'Equifax', symbol: 'EQF' }
      }
      let merged_credit_report = undefined;

      if (original_report) {
        original_report = original_report.filter((obj) => { return obj.Type == 'MergeCreditReports' })
        merged_credit_report = (original_report.length) ? original_report[0].TrueLinkCreditReportType : undefined;

        if (merged_credit_report) {
          modifiedReport.CreditReport = [
            {
              "DateReport": "2024-11-26",
              "ReportProvider": "MyFreeScoreNow"
            }]

          //Section Borrower Name 
          const BorrowerName = await this.convertToArrayOfObjects(merged_credit_report.Borrower.BorrowerName)

          modifiedReport.Name = BorrowerName.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "FirstName": borrower.Name.first || '',
              "Middle": borrower.Name.middle || '',
              "LastName": borrower.Name.last || '',
              "NameType": borrower.NameType.description || ''
            }
          })

          //Section Borrower Current Address
          const BorrowerAddress = await this.convertToArrayOfObjects(merged_credit_report.Borrower.BorrowerAddress)

          modifiedReport.Address = BorrowerAddress.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "StreetAddress": borrower.CreditAddress.unparsedStreet || `${borrower.CreditAddress.houseNumber} ${borrower.CreditAddress.streetName} ${borrower.CreditAddress.unit}`,
              "City": borrower.CreditAddress.city,
              "State": borrower.CreditAddress.stateCode,
              "Zip": borrower.CreditAddress.postalCode,
              "AddressType": "Current"
            }
          })

          //Section Borrower Previous Address
          const PreviousAddress = await this.convertToArrayOfObjects(merged_credit_report.Borrower.PreviousAddress)

          modifiedReport.Address = PreviousAddress.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "StreetAddress": borrower.CreditAddress.unparsedStreet || `${borrower.CreditAddress.houseNumber} ${borrower.CreditAddress.streetName} ${borrower.CreditAddress.unit}`,
              "City": borrower.CreditAddress.city,
              "State": borrower.CreditAddress.stateCode,
              "Zip": borrower.CreditAddress.postalCode,
              "AddressType": "Previous"
            }
          })

          //Section Borrower DOB
          const Birth = await this.convertToArrayOfObjects(merged_credit_report.Borrower.Birth)

          modifiedReport.DOB = Birth.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "DOB": borrower.date
            }
          })

          const CreditScore = await this.convertToArrayOfObjects(merged_credit_report.Borrower.CreditScore)
          //Section Borrower Score
          modifiedReport.Score = CreditScore.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "Score": borrower.riskScore,
              "ScoreType": borrower.scoreName,
              "DateScore": borrower.Source.InquiryDate
            }
          })

          const Employer = await this.convertToArrayOfObjects(merged_credit_report.Borrower.Employer)

          //Section Borrower Employer
          modifiedReport.Employer = Employer.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "EmployerName": borrower.name,
              "DateUpdated": borrower.dateUpdated,
              "DateReported": borrower.dateReported
            }
          })

          merged_credit_report.InquiryPartition = await this.convertToArrayOfObjects(merged_credit_report.InquiryPartition)
          //Section Borrower Inquiries
          modifiedReport.Inquiries = merged_credit_report.InquiryPartition.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Inquiry.Source.Bureau.symbol].id,
              "DateInquiry": borrower.Inquiry.inquiryDate,
              "CreditorName": borrower.Inquiry.subscriberName,
              "InquiryType": borrower.Inquiry.inquiryType,
              "Industry": borrower.Inquiry.IndustryCode.description
            }
          })

          modifiedReport.PublicRecords = (merged_credit_report.PulblicRecordPartition && merged_credit_report.PulblicRecordPartition.PublicRecord && Array.isArray(merged_credit_report.PulblicRecordPartition.PublicRecord))
            ? merged_credit_report.PulblicRecordPartition.PublicRecord.map((publicRecord) => {
              return {
                "BureauId": bureau[publicRecord.Source.Bureau.symbol].id,
                "Date": publicRecord.dateFiled,
                "Classification": publicRecord.Classification.description,
                "Status": publicRecord.Status.description,
                "Industry": publicRecord.IndustryCode.description,
                "Type": publicRecord.Type.description,
                "AccountDesignator": publicRecord.AccountDesignator.description
              }
            }) : [];

          //Section Borrower Accounts
          modifiedReport.Accounts = [];

          merged_credit_report.TradeLinePartition = await this.convertToArrayOfObjects(merged_credit_report.TradeLinePartition)

          merged_credit_report.TradeLinePartition.map((borrower) => {
            if (!Array.isArray(borrower.Tradeline)) borrower.Tradeline = [borrower.Tradeline]
            let accounts = borrower.Tradeline.map((tradeline) => {
              if (!Array.isArray(tradeline?.Remark)) tradeline.Remark = [tradeline.Remark || undefined]
              modifiedReport.Accounts.push({
                "BureauId": bureau[tradeline.Source.Bureau.symbol].id,
                "AccountTypeDescription": borrower.accountTypeDescription,
                "HighBalance": tradeline?.highBalance,
                "DateReported": tradeline?.dateReported,
                "DateOpened": tradeline?.dateOpened,
                "AccountNumber": tradeline?.accountNumber,
                "DateAccountStatus": tradeline?.dateAccountStatus,
                "CurrentBalance": tradeline?.currentBalance,
                "CreditorName": tradeline?.creditorName,
                "AccountCondition": tradeline?.AccountCondition?.description,
                "AccountDesignator": tradeline?.AccountDesignator?.description,
                "DisputeFlag": tradeline?.DisputeFlag?.description,
                "Industry": tradeline?.IndustryCode?.description,
                "AccountStatus": tradeline?.OpenClosed?.description,
                "PaymentStatus": tradeline?.PayStatus?.description,
                "AmountPastDue": tradeline?.GrantedTrade?.amountPastDue,
                "AccountType": tradeline?.GrantedTrade?.AccountType.description,
                "CreditType": tradeline?.GrantedTrade?.CreditType.description,
                "PaymentFrequency": tradeline?.GrantedTrade?.PaymentFrequency?.description,
                "TermType": tradeline?.GrantedTrade?.TermType?.description,
                "WorstPayStatus": tradeline?.GrantedTrade?.WorstPayStatus?.description,
                "PayStatusHistoryStartDate": tradeline?.GrantedTrade?.PayStatusHistory?.startDate,
                "PayStatusHistory": tradeline?.GrantedTrade?.PayStatusHistory?.status,
                "Remark": tradeline.Remark[0]?.RemarkCode.description,
                "CreditLimit": tradeline?.GrantedTrade?.CreditLimit
              })
            })
          })

          //Section Borrower Creditors
          const Subscriber = await this.convertToArrayOfObjects(merged_credit_report.Subscriber)

          modifiedReport.Creditors = Subscriber.map((borrower) => {
            return {
              "BureauId": bureau[borrower.Source.Bureau.symbol].id,
              "CreditorName": borrower.name,
              "CreditorAddress": borrower.CreditAddress.unparsedStreet || '',
              "CreditorCity": borrower.CreditAddress.city?.trim(),
              "CreditorState": borrower.CreditAddress.stateCode,
              "CreditorZip": borrower.CreditAddress.postalCode,
              "CreditorPhone": borrower.telephone,
              "Industry": borrower.IndustryCode.description
            }
          })
        }
        modifiedReport.Accounts = modifiedReport.Accounts.sort((a, b) => a.BureauId - b.BureauId);
      }
      return modifiedReport;
    } catch (error) {
      throw error;
    }
  }

  async convertToArrayOfObjects(variable) {
    if (Array.isArray(variable)) {
      return variable; // Return as is if it's already an array
    } else if (typeof variable === 'object' && variable !== null) {
      return [variable]; // Convert object to array of objects
    }
    return []; // Return empty array for other data types
  }

  async close() {
    if (!this.browser) throw new Error('Browser is not initialized. Call initialize() first.');
    if (this.page) await this.page.close();
    await this.browser.close();
  }
}