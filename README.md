# node-quickbooks

Node.js client for [Quickbooks V3 API] [1].

## Installation

`npm install node-quickbooks`


## Documentation

```javascript

var Quickbooks = require('node-quickbooks')

var qbo = new Quickbooks(consumerKey,
                         consumerSecret,
                         oauthToken,
                         oauthTokenSecret,
                         realmId,
                         true); // turn debugging on

qbo.createAttachable({Note: 'My File'}, function(err, attachable) {
  if (err) console.log(err)
  else console.log(attachable.Id)
})

qbo.getBillPayment(42, function(err, billPayment) {
  console.log(billPayment)
})

qbo.updateCustomer({
  Id: 42,
  SyncToken: 1,
  sparse: true,
  PrimaryEmailAddr: {Address: 'customer@example.com'}
})  // with no callback, i.e. "fire 'n forget"

qbo.deleteAttachable(42)

qbo.findAccounts({AccountType: 'Expense'}, function(_, accounts) {
  accounts.QueryResponse.Account.forEach(function(account) {
    console.log(account.Name)
  })
})

qbo.reportBalanceSheet({department: '1,4,7'}, function(_, balanceSheet) {
  console.log(balanceSheet)
})

```

## Example App

The `example` directory contains a bare bones Express application that demonstrates the OAuth workflow. 

Running `node app.js` in the example directory will start an http server running on port 3000. Browsing to http://localhost:3000/start will display a page containing only the IPP Javascript-rendered button, kicking off the OAuth exchange. Note that the IPP Javascript code contained in `intuit.ejs` is configured with the `grantUrl` option set to "http://localhost:3000/requestToken". You will want to change this to an appropriate URL for your application, but you will need to write similar functionality to that contained in the  '/requestToken' route configured in `app.js`, also taking care to configure your `consumerKey` and `consumerSecret` on lines 27-28 in app.js.

The IPP Javascript code calls back into the node application, which needs to invoke the OAuth Request Token URL at https://oauth.intuit.com/oauth/v1/get_request_token via a server-side http POST method. Note how the response from the http POST is parsed and the browser is redirected to the App Center URL at https://appcenter.intuit.com/Connect/Begin?oauth_token= with the `oauth_token` passed as a URL parameter. Note also how the `oauth_token_secret` needs to somehow be maintained across http requests, as it needs to be passed in the second server-side http POST to the Access Token URL at https://oauth.intuit.com/oauth/v1/get_access_token. This final step is invoked once the user has authenticated on Intuit's site and authorized the application, and then the user is redirected back to the node application at the callback URL specified as a parameter in the Request Token remote call, in the example app's case, http://localhost:3000/callback.


## Running the tests

First you'll need to fill in the missing values in config.js. The consumerKey and consumerSecret you can get from the IPP portal, the token, tokenSecret, and realmId are easiest to obtain by running the example app, completing the OAuth workflow, and copying the values that are logged to the console. Once you've filled in the missing credentials in config.js you can simply run:

`npm test` 


## Public Api

Quickbooks(consumerKey, consumerSecret, oauth_token, oauth_token_secret, realmId, debug)

__Arguments__

* `consumerKey` - The application's consumer key
* `consumerSecret` - The application's consumer secret
* `oauth_token` - The user's generated token
* `oauth_token_secret` - The user's generated secret
* `realmId` - The company ID
* `debug` - boolean flag to log http requests, headers, and response bodies to the console


#### Create

* [`createAccount`](#createAccount)
* [`createAttachable`](#createAttachable)
* [`createBill`](#createBill)
* [`createBillPayment`](#createBillPayment)
* [`createClass`](#createClass)
* [`createCreditMemo`](#createCreditMemo)
* [`createCustomer`](#createCustomer)
* [`createDepartment`](#createDepartment)
* [`createEmployee`](#createEmployee)
* [`createEstimate`](#createEstimate)
* [`createInvoice`](#createInvoice)
* [`createItem`](#createItem)
* [`createJournalEntry`](#createJournalEntry)
* [`createPayment`](#createPayment)
* [`createPaymentMethod`](#createPaymentMethod)
* [`createPurchase`](#createPurchase)
* [`createPurchaseOrder`](#createPurchaseOrder)
* [`createRefundReceipt`](#createRefundReceipt)
* [`createSalesReceipt`](#createSalesReceipt)
* [`createTaxAgency`](#createTaxAgency)
* [`createTaxService`](#createTaxService)
* [`createTerm`](#createTerm)
* [`createTimeActivity`](#createTimeActivity)
* [`createVendor`](#createVendor)
* [`createVendorCredit`](#createVendorCredit)

#### Read

* [`getAccount`](#getAccount)
* [`getAttachable`](#getAttachable)
* [`getBill`](#getBill)
* [`getBillPayment`](#getBillPayment)
* [`getClass`](#getClass)
* [`getCompanyInfo`](#getCompanyInfo)
* [`getCreditMemo`](#getCreditMemo)
* [`getCustomer`](#getCustomer)
* [`getDepartment`](#getDepartment)
* [`getEmployee`](#getEmployee)
* [`getEstimate`](#getEstimate)
* [`getInvoice`](#getInvoice)
* [`getItem`](#getItem)
* [`getJournalEntry`](#getJournalEntry)
* [`getPayment`](#getPayment)
* [`getPaymentMethod`](#getPaymentMethod)
* [`getPreferences`](#getPreferences)
* [`getPurchase`](#getPurchase)
* [`getPurchaseOrder`](#getPurchaseOrder)
* [`getRefundReceipt`](#getRefundReceipt)
* [`getReports`](#getReports)
* [`getSalesReceipt`](#getSalesReceipt)
* [`getTaxAgency`](#getTaxAgency)
* [`getTaxCode`](#getTaxCode)
* [`getTaxRate`](#getTaxRate)
* [`getTerm`](#getTerm)
* [`getTimeActivity`](#getTimeActivity)
* [`getVendor`](#getVendor)
* [`getVendorCredit`](#getVendorCredit)

#### Update

* [`updateAccount`](#updateAccount)
* [`updateAttachable`](#updateAttachable)
* [`updateBill`](#updateBill)
* [`updateBillPayment`](#updateBillPayment)
* [`updateClass`](#updateClass)
* [`updateCompanyInfo`](#updateCompanyInfo)
* [`updateCreditMemo`](#updateCreditMemo)
* [`updateCustomer`](#updateCustomer)
* [`updateDepartment`](#updateDepartment)
* [`updateEmployee`](#updateEmployee)
* [`updateEstimate`](#updateEstimate)
* [`updateInvoice`](#updateInvoice)
* [`updateItem`](#updateItem)
* [`updateJournalEntry`](#updateJournalEntry)
* [`updatePayment`](#updatePayment)
* [`updatePaymentMethod`](#updatePaymentMethod)
* [`updatePreferences`](#updatePreferences)
* [`updatePurchase`](#updatePurchase)
* [`updatePurchaseOrder`](#updatePurchaseOrder)
* [`updateRefundReceipt`](#updateRefundReceipt)
* [`updateSalesReceipt`](#updateSalesReceipt)
* [`updateTaxAgency`](#updateTaxAgency)
* [`updateTaxCode`](#updateTaxCode)
* [`updateTaxRate`](#updateTaxRate)
* [`updateTaxService`](#updateTaxService)
* [`updateTerm`](#updateTerm)
* [`updateTimeActivity`](#updateTimeActivity)
* [`updateVendor`](#updateVendor)
* [`updateVendorCredit`](#updateVendorCredit)

#### Delete

* [`deleteAttachable`](#deleteAttachable)
* [`deleteBill`](#deleteBill)
* [`deleteBillPayment`](#deleteBillPayment)
* [`deleteCreditMemo`](#deleteCreditMemo)
* [`deleteEstimate`](#deleteEstimate)
* [`deleteInvoice`](#deleteInvoice)
* [`deleteJournalEntry`](#deleteJournalEntry)
* [`deletePayment`](#deletePayment)
* [`deletePurchase`](#deletePurchase)
* [`deletePurchaseOrder`](#deletePurchaseOrder)
* [`deleteRefundReceipt`](#deleteRefundReceipt)
* [`deleteSalesReceipt`](#deleteSalesReceipt)
* [`deleteTimeActivity`](#deleteTimeActivity)
* [`deleteVendorCredit`](#deleteVendorCredit)

#### Query

* [`findAccounts`](#findAccounts)
* [`findAttachables`](#findAttachables)
* [`findBills`](#findBills)
* [`findBillPayments`](#findBillPayments)
* [`findBudgets`](#findBudgets)
* [`findClasses`](#findClasses)
* [`findCompanyInfos`](#findCompanyInfos)
* [`findCreditMemos`](#findCreditMemos)
* [`findCustomers`](#findCustomers)
* [`findDepartments`](#findDepartments)
* [`findEmployees`](#findEmployees)
* [`findEstimates`](#findEstimates)
* [`findInvoices`](#findInvoices)
* [`findItems`](#findItems)
* [`findJournalEntries`](#findJournalEntries)
* [`findPayments`](#findPayments)
* [`findPaymentMethods`](#findPaymentMethods)
* [`findPreferenceses`](#findPreferenceses)
* [`findPurchases`](#findPurchases)
* [`findPurchaseOrders`](#findPurchaseOrders)
* [`findRefundReceipts`](#findRefundReceipts)
* [`findSalesReceipts`](#findSalesReceipts)
* [`findTaxAgencies`](#findTaxAgencies)
* [`findTaxCodes`](#findTaxCodes)
* [`findTaxRates`](#findTaxRates)
* [`findTerms`](#findTerms)
* [`findTimeActivities`](#findTimeActivities)
* [`findVendors`](#findVendors)
* [`findVendorCredits`](#findVendorCredits)

#### Reports

* [`reportBalanceSheet`](#reportBalanceSheet)
* [`reportProfitAndLoss`](#reportProfitAndLoss)
* [`reportProfitAndLossDetail`](#reportProfitAndLossDetail)
* [`reportTrialBalance`](#reportTrialBalance)
* [`reportCashFlow`](#reportCashFlow)
* [`reportInventoryValuationSummary`](#reportInventoryValuationSummary)
* [`reportCustomerSales`](#reportCustomerSales)
* [`reportItemSales`](#reportItemSales)
* [`reportCustomerIncome`](#reportCustomerIncome)
* [`reportCustomerBalance`](#reportCustomerBalance)
* [`reportCustomerBalanceDetail`](#reportCustomerBalanceDetail)
* [`reportAgedReceivables`](#reportAgedReceivables)
* [`reportAgedReceivableDetail`](#reportAgedReceivableDetail)
* [`reportVendorBalance`](#reportVendorBalance)
* [`reportVendorBalanceDetail`](#reportVendorBalanceDetail)
* [`reportAgedPayables`](#reportAgedPayables)
* [`reportAgedPayableDetail`](#reportAgedPayableDetail)
* [`reportVendorExpenses`](#reportVendorExpenses)
* [`reportGeneralLedgerDetail`](#reportGeneralLedgerDetail)
* [`reportDepartmentSales`](#reportDepartmentSales)
* [`reportClassSales`](#reportClassSales)


<a name="createAccount" />
#### createAccount(object, callback)
  
Creates the Account in Quickbooks 
 
__Arguments__

* `object` - The unsaved account, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Account


<a name="createAttachable" />
#### createAttachable(object, callback)
  
Creates the Attachable in Quickbooks 
 
__Arguments__

* `object` - The unsaved attachable, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Attachable


<a name="createBill" />
#### createBill(object, callback)
  
Creates the Bill in Quickbooks 
 
__Arguments__

* `object` - The unsaved bill, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Bill


<a name="createBillPayment" />
#### createBillPayment(object, callback)
  
Creates the BillPayment in Quickbooks 
 
__Arguments__

* `object` - The unsaved billPayment, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent BillPayment


<a name="createClass" />
#### createClass(object, callback)
  
Creates the Class in Quickbooks 
 
__Arguments__

* `object` - The unsaved class, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Class


<a name="createCreditMemo" />
#### createCreditMemo(object, callback)
  
Creates the CreditMemo in Quickbooks 
 
__Arguments__

* `object` - The unsaved creditMemo, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent CreditMemo


<a name="createCustomer" />
#### createCustomer(object, callback)
  
Creates the Customer in Quickbooks 
 
__Arguments__

* `object` - The unsaved customer, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Customer


<a name="createDepartment" />
#### createDepartment(object, callback)
  
Creates the Department in Quickbooks 
 
__Arguments__

* `object` - The unsaved department, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Department


<a name="createEmployee" />
#### createEmployee(object, callback)
  
Creates the Employee in Quickbooks 
 
__Arguments__

* `object` - The unsaved employee, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Employee


<a name="createEstimate" />
#### createEstimate(object, callback)
  
Creates the Estimate in Quickbooks 
 
__Arguments__

* `object` - The unsaved estimate, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Estimate


<a name="createInvoice" />
#### createInvoice(object, callback)
  
Creates the Invoice in Quickbooks 
 
__Arguments__

* `object` - The unsaved invoice, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Invoice


<a name="createItem" />
#### createItem(object, callback)
  
Creates the Item in Quickbooks 
 
__Arguments__

* `object` - The unsaved item, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Item


<a name="createJournalEntry" />
#### createJournalEntry(object, callback)
  
Creates the JournalEntry in Quickbooks 
 
__Arguments__

* `object` - The unsaved journalEntry, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent JournalEntry


<a name="createPayment" />
#### createPayment(object, callback)
  
Creates the Payment in Quickbooks 
 
__Arguments__

* `object` - The unsaved payment, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Payment


<a name="createPaymentMethod" />
#### createPaymentMethod(object, callback)
  
Creates the PaymentMethod in Quickbooks 
 
__Arguments__

* `object` - The unsaved paymentMethod, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent PaymentMethod


<a name="createPurchase" />
#### createPurchase(object, callback)
  
Creates the Purchase in Quickbooks 
 
__Arguments__

* `object` - The unsaved purchase, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Purchase


<a name="createPurchaseOrder" />
#### createPurchaseOrder(object, callback)
  
Creates the PurchaseOrder in Quickbooks 
 
__Arguments__

* `object` - The unsaved purchaseOrder, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent PurchaseOrder


<a name="createRefundReceipt" />
#### createRefundReceipt(object, callback)
  
Creates the RefundReceipt in Quickbooks 
 
__Arguments__

* `object` - The unsaved refundReceipt, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent RefundReceipt


<a name="createSalesReceipt" />
#### createSalesReceipt(object, callback)
  
Creates the SalesReceipt in Quickbooks 
 
__Arguments__

* `object` - The unsaved salesReceipt, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent SalesReceipt


<a name="createTaxAgency" />
#### createTaxAgency(object, callback)
  
Creates the TaxAgency in Quickbooks 
 
__Arguments__

* `object` - The unsaved taxAgency, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent TaxAgency


<a name="createTaxService" />
#### createTaxService(object, callback)
  
Creates the TaxService in Quickbooks 
 
__Arguments__

* `object` - The unsaved taxService, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent TaxService


<a name="createTerm" />
#### createTerm(object, callback)
  
Creates the Term in Quickbooks 
 
__Arguments__

* `object` - The unsaved term, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Term


<a name="createTimeActivity" />
#### createTimeActivity(object, callback)
  
Creates the TimeActivity in Quickbooks 
 
__Arguments__

* `object` - The unsaved timeActivity, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent TimeActivity


<a name="createVendor" />
#### createVendor(object, callback)
  
Creates the Vendor in Quickbooks 
 
__Arguments__

* `object` - The unsaved vendor, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent Vendor


<a name="createVendorCredit" />
#### createVendorCredit(object, callback)
  
Creates the VendorCredit in Quickbooks 
 
__Arguments__

* `object` - The unsaved vendorCredit, to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent VendorCredit




<a name="getAccount" />
#### getAccount(id, callback)
  
Retrieves the Account from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Account
* `callback` - Callback function which is called with any error and the persistent Account


<a name="getAttachable" />
#### getAttachable(id, callback)
  
Retrieves the Attachable from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Attachable
* `callback` - Callback function which is called with any error and the persistent Attachable


<a name="getBill" />
#### getBill(id, callback)
  
Retrieves the Bill from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Bill
* `callback` - Callback function which is called with any error and the persistent Bill


<a name="getBillPayment" />
#### getBillPayment(id, callback)
  
Retrieves the BillPayment from Quickbooks
 
__Arguments__

* `id` - The Id of persistent BillPayment
* `callback` - Callback function which is called with any error and the persistent BillPayment


<a name="getClass" />
#### getClass(id, callback)
  
Retrieves the Class from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Class
* `callback` - Callback function which is called with any error and the persistent Class


<a name="getCompanyInfo" />
#### getCompanyInfo(id, callback)
  
Retrieves the CompanyInfo from Quickbooks
 
__Arguments__

* `id` - The Id of persistent CompanyInfo
* `callback` - Callback function which is called with any error and the persistent CompanyInfo


<a name="getCreditMemo" />
#### getCreditMemo(id, callback)
  
Retrieves the CreditMemo from Quickbooks
 
__Arguments__

* `id` - The Id of persistent CreditMemo
* `callback` - Callback function which is called with any error and the persistent CreditMemo


<a name="getCustomer" />
#### getCustomer(id, callback)
  
Retrieves the Customer from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Customer
* `callback` - Callback function which is called with any error and the persistent Customer


<a name="getDepartment" />
#### getDepartment(id, callback)
  
Retrieves the Department from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Department
* `callback` - Callback function which is called with any error and the persistent Department


<a name="getEmployee" />
#### getEmployee(id, callback)
  
Retrieves the Employee from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Employee
* `callback` - Callback function which is called with any error and the persistent Employee


<a name="getEstimate" />
#### getEstimate(id, callback)
  
Retrieves the Estimate from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Estimate
* `callback` - Callback function which is called with any error and the persistent Estimate


<a name="getInvoice" />
#### getInvoice(id, callback)
  
Retrieves the Invoice from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Invoice
* `callback` - Callback function which is called with any error and the persistent Invoice


<a name="getItem" />
#### getItem(id, callback)
  
Retrieves the Item from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Item
* `callback` - Callback function which is called with any error and the persistent Item


<a name="getJournalEntry" />
#### getJournalEntry(id, callback)
  
Retrieves the JournalEntry from Quickbooks
 
__Arguments__

* `id` - The Id of persistent JournalEntry
* `callback` - Callback function which is called with any error and the persistent JournalEntry


<a name="getPayment" />
#### getPayment(id, callback)
  
Retrieves the Payment from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Payment
* `callback` - Callback function which is called with any error and the persistent Payment


<a name="getPaymentMethod" />
#### getPaymentMethod(id, callback)
  
Retrieves the PaymentMethod from Quickbooks
 
__Arguments__

* `id` - The Id of persistent PaymentMethod
* `callback` - Callback function which is called with any error and the persistent PaymentMethod


<a name="getPreferences" />
#### getPreferences(id, callback)
  
Retrieves the Preferences from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Preferences
* `callback` - Callback function which is called with any error and the persistent Preferences


<a name="getPurchase" />
#### getPurchase(id, callback)
  
Retrieves the Purchase from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Purchase
* `callback` - Callback function which is called with any error and the persistent Purchase


<a name="getPurchaseOrder" />
#### getPurchaseOrder(id, callback)
  
Retrieves the PurchaseOrder from Quickbooks
 
__Arguments__

* `id` - The Id of persistent PurchaseOrder
* `callback` - Callback function which is called with any error and the persistent PurchaseOrder


<a name="getRefundReceipt" />
#### getRefundReceipt(id, callback)
  
Retrieves the RefundReceipt from Quickbooks
 
__Arguments__

* `id` - The Id of persistent RefundReceipt
* `callback` - Callback function which is called with any error and the persistent RefundReceipt


<a name="getReports" />
#### getReports(id, callback)
  
Retrieves the Reports from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Reports
* `callback` - Callback function which is called with any error and the persistent Reports


<a name="getSalesReceipt" />
#### getSalesReceipt(id, callback)
  
Retrieves the SalesReceipt from Quickbooks
 
__Arguments__

* `id` - The Id of persistent SalesReceipt
* `callback` - Callback function which is called with any error and the persistent SalesReceipt


<a name="getTaxAgency" />
#### getTaxAgency(id, callback)
  
Retrieves the TaxAgency from Quickbooks
 
__Arguments__

* `id` - The Id of persistent TaxAgency
* `callback` - Callback function which is called with any error and the persistent TaxAgency


<a name="getTaxCode" />
#### getTaxCode(id, callback)
  
Retrieves the TaxCode from Quickbooks
 
__Arguments__

* `id` - The Id of persistent TaxCode
* `callback` - Callback function which is called with any error and the persistent TaxCode


<a name="getTaxRate" />
#### getTaxRate(id, callback)
  
Retrieves the TaxRate from Quickbooks
 
__Arguments__

* `id` - The Id of persistent TaxRate
* `callback` - Callback function which is called with any error and the persistent TaxRate


<a name="getTerm" />
#### getTerm(id, callback)
  
Retrieves the Term from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Term
* `callback` - Callback function which is called with any error and the persistent Term


<a name="getTimeActivity" />
#### getTimeActivity(id, callback)
  
Retrieves the TimeActivity from Quickbooks
 
__Arguments__

* `id` - The Id of persistent TimeActivity
* `callback` - Callback function which is called with any error and the persistent TimeActivity


<a name="getVendor" />
#### getVendor(id, callback)
  
Retrieves the Vendor from Quickbooks
 
__Arguments__

* `id` - The Id of persistent Vendor
* `callback` - Callback function which is called with any error and the persistent Vendor


<a name="getVendorCredit" />
#### getVendorCredit(id, callback)
  
Retrieves the VendorCredit from Quickbooks
 
__Arguments__

* `id` - The Id of persistent VendorCredit
* `callback` - Callback function which is called with any error and the persistent VendorCredit




<a name="updateAccount" />
#### updateAccount(object, callback)
  
Updates Quickbooks version of Account
 
__Arguments__

* `object` - The persistent Account, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Account


<a name="updateAttachable" />
#### updateAttachable(object, callback)
  
Updates Quickbooks version of Attachable
 
__Arguments__

* `object` - The persistent Attachable, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Attachable


<a name="updateBill" />
#### updateBill(object, callback)
  
Updates Quickbooks version of Bill
 
__Arguments__

* `object` - The persistent Bill, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Bill


<a name="updateBillPayment" />
#### updateBillPayment(object, callback)
  
Updates Quickbooks version of BillPayment
 
__Arguments__

* `object` - The persistent BillPayment, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated BillPayment


<a name="updateClass" />
#### updateClass(object, callback)
  
Updates Quickbooks version of Class
 
__Arguments__

* `object` - The persistent Class, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Class


<a name="updateCompanyInfo" />
#### updateCompanyInfo(object, callback)
  
Updates Quickbooks version of CompanyInfo
 
__Arguments__

* `object` - The persistent CompanyInfo, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated CompanyInfo


<a name="updateCreditMemo" />
#### updateCreditMemo(object, callback)
  
Updates Quickbooks version of CreditMemo
 
__Arguments__

* `object` - The persistent CreditMemo, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated CreditMemo


<a name="updateCustomer" />
#### updateCustomer(object, callback)
  
Updates Quickbooks version of Customer
 
__Arguments__

* `object` - The persistent Customer, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Customer


<a name="updateDepartment" />
#### updateDepartment(object, callback)
  
Updates Quickbooks version of Department
 
__Arguments__

* `object` - The persistent Department, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Department


<a name="updateEmployee" />
#### updateEmployee(object, callback)
  
Updates Quickbooks version of Employee
 
__Arguments__

* `object` - The persistent Employee, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Employee


<a name="updateEstimate" />
#### updateEstimate(object, callback)
  
Updates Quickbooks version of Estimate
 
__Arguments__

* `object` - The persistent Estimate, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Estimate


<a name="updateInvoice" />
#### updateInvoice(object, callback)
  
Updates Quickbooks version of Invoice
 
__Arguments__

* `object` - The persistent Invoice, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Invoice


<a name="updateItem" />
#### updateItem(object, callback)
  
Updates Quickbooks version of Item
 
__Arguments__

* `object` - The persistent Item, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Item


<a name="updateJournalEntry" />
#### updateJournalEntry(object, callback)
  
Updates Quickbooks version of JournalEntry
 
__Arguments__

* `object` - The persistent JournalEntry, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated JournalEntry


<a name="updatePayment" />
#### updatePayment(object, callback)
  
Updates Quickbooks version of Payment
 
__Arguments__

* `object` - The persistent Payment, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Payment


<a name="updatePaymentMethod" />
#### updatePaymentMethod(object, callback)
  
Updates Quickbooks version of PaymentMethod
 
__Arguments__

* `object` - The persistent PaymentMethod, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated PaymentMethod


<a name="updatePreferences" />
#### updatePreferences(object, callback)
  
Updates Quickbooks version of Preferences
 
__Arguments__

* `object` - The persistent Preferences, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Preferences


<a name="updatePurchase" />
#### updatePurchase(object, callback)
  
Updates Quickbooks version of Purchase
 
__Arguments__

* `object` - The persistent Purchase, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Purchase


<a name="updatePurchaseOrder" />
#### updatePurchaseOrder(object, callback)
  
Updates Quickbooks version of PurchaseOrder
 
__Arguments__

* `object` - The persistent PurchaseOrder, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated PurchaseOrder


<a name="updateRefundReceipt" />
#### updateRefundReceipt(object, callback)
  
Updates Quickbooks version of RefundReceipt
 
__Arguments__

* `object` - The persistent RefundReceipt, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated RefundReceipt


<a name="updateSalesReceipt" />
#### updateSalesReceipt(object, callback)
  
Updates Quickbooks version of SalesReceipt
 
__Arguments__

* `object` - The persistent SalesReceipt, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated SalesReceipt


<a name="updateTaxAgency" />
#### updateTaxAgency(object, callback)
  
Updates Quickbooks version of TaxAgency
 
__Arguments__

* `object` - The persistent TaxAgency, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated TaxAgency


<a name="updateTaxCode" />
#### updateTaxCode(object, callback)
  
Updates Quickbooks version of TaxCode
 
__Arguments__

* `object` - The persistent TaxCode, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated TaxCode


<a name="updateTaxRate" />
#### updateTaxRate(object, callback)
  
Updates Quickbooks version of TaxRate
 
__Arguments__

* `object` - The persistent TaxRate, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated TaxRate


<a name="updateTaxService" />
#### updateTaxService(object, callback)
  
Updates Quickbooks version of TaxService
 
__Arguments__

* `object` - The persistent TaxService, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated TaxService


<a name="updateTerm" />
#### updateTerm(object, callback)
  
Updates Quickbooks version of Term
 
__Arguments__

* `object` - The persistent Term, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Term


<a name="updateTimeActivity" />
#### updateTimeActivity(object, callback)
  
Updates Quickbooks version of TimeActivity
 
__Arguments__

* `object` - The persistent TimeActivity, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated TimeActivity


<a name="updateVendor" />
#### updateVendor(object, callback)
  
Updates Quickbooks version of Vendor
 
__Arguments__

* `object` - The persistent Vendor, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated Vendor


<a name="updateVendorCredit" />
#### updateVendorCredit(object, callback)
  
Updates Quickbooks version of VendorCredit
 
__Arguments__

* `object` - The persistent VendorCredit, including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated VendorCredit




<a name="deleteAttachable" />
#### deleteAttachable(idOrEntity, callback)
  
Deletes the Attachable from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent Attachable to be deleted, or the Id of the Attachable, in which case an extra GET request will be issued to first retrieve the Attachable 
* `callback` - Callback function which is called with any error and the status of the persistent Attachable


<a name="deleteBill" />
#### deleteBill(idOrEntity, callback)
  
Deletes the Bill from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent Bill to be deleted, or the Id of the Bill, in which case an extra GET request will be issued to first retrieve the Bill 
* `callback` - Callback function which is called with any error and the status of the persistent Bill


<a name="deleteBillPayment" />
#### deleteBillPayment(idOrEntity, callback)
  
Deletes the BillPayment from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent BillPayment to be deleted, or the Id of the BillPayment, in which case an extra GET request will be issued to first retrieve the BillPayment 
* `callback` - Callback function which is called with any error and the status of the persistent BillPayment


<a name="deleteCreditMemo" />
#### deleteCreditMemo(idOrEntity, callback)
  
Deletes the CreditMemo from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent CreditMemo to be deleted, or the Id of the CreditMemo, in which case an extra GET request will be issued to first retrieve the CreditMemo 
* `callback` - Callback function which is called with any error and the status of the persistent CreditMemo


<a name="deleteEstimate" />
#### deleteEstimate(idOrEntity, callback)
  
Deletes the Estimate from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent Estimate to be deleted, or the Id of the Estimate, in which case an extra GET request will be issued to first retrieve the Estimate 
* `callback` - Callback function which is called with any error and the status of the persistent Estimate


<a name="deleteInvoice" />
#### deleteInvoice(idOrEntity, callback)
  
Deletes the Invoice from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent Invoice to be deleted, or the Id of the Invoice, in which case an extra GET request will be issued to first retrieve the Invoice 
* `callback` - Callback function which is called with any error and the status of the persistent Invoice


<a name="deleteJournalEntry" />
#### deleteJournalEntry(idOrEntity, callback)
  
Deletes the JournalEntry from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent JournalEntry to be deleted, or the Id of the JournalEntry, in which case an extra GET request will be issued to first retrieve the JournalEntry 
* `callback` - Callback function which is called with any error and the status of the persistent JournalEntry


<a name="deletePayment" />
#### deletePayment(idOrEntity, callback)
  
Deletes the Payment from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent Payment to be deleted, or the Id of the Payment, in which case an extra GET request will be issued to first retrieve the Payment 
* `callback` - Callback function which is called with any error and the status of the persistent Payment


<a name="deletePurchase" />
#### deletePurchase(idOrEntity, callback)
  
Deletes the Purchase from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent Purchase to be deleted, or the Id of the Purchase, in which case an extra GET request will be issued to first retrieve the Purchase 
* `callback` - Callback function which is called with any error and the status of the persistent Purchase


<a name="deletePurchaseOrder" />
#### deletePurchaseOrder(idOrEntity, callback)
  
Deletes the PurchaseOrder from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent PurchaseOrder to be deleted, or the Id of the PurchaseOrder, in which case an extra GET request will be issued to first retrieve the PurchaseOrder 
* `callback` - Callback function which is called with any error and the status of the persistent PurchaseOrder


<a name="deleteRefundReceipt" />
#### deleteRefundReceipt(idOrEntity, callback)
  
Deletes the RefundReceipt from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent RefundReceipt to be deleted, or the Id of the RefundReceipt, in which case an extra GET request will be issued to first retrieve the RefundReceipt 
* `callback` - Callback function which is called with any error and the status of the persistent RefundReceipt


<a name="deleteSalesReceipt" />
#### deleteSalesReceipt(idOrEntity, callback)
  
Deletes the SalesReceipt from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent SalesReceipt to be deleted, or the Id of the SalesReceipt, in which case an extra GET request will be issued to first retrieve the SalesReceipt 
* `callback` - Callback function which is called with any error and the status of the persistent SalesReceipt


<a name="deleteTimeActivity" />
#### deleteTimeActivity(idOrEntity, callback)
  
Deletes the TimeActivity from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent TimeActivity to be deleted, or the Id of the TimeActivity, in which case an extra GET request will be issued to first retrieve the TimeActivity 
* `callback` - Callback function which is called with any error and the status of the persistent TimeActivity


<a name="deleteVendorCredit" />
#### deleteVendorCredit(idOrEntity, callback)
  
Deletes the VendorCredit from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent VendorCredit to be deleted, or the Id of the VendorCredit, in which case an extra GET request will be issued to first retrieve the VendorCredit 
* `callback` - Callback function which is called with any error and the status of the persistent VendorCredit




<a name="findAccounts" />
#### findAccounts(criteria, callback)
  
Finds all Accounts in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Account


<a name="findAttachables" />
#### findAttachables(criteria, callback)
  
Finds all Attachables in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Attachable


<a name="findBills" />
#### findBills(criteria, callback)
  
Finds all Bills in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Bill


<a name="findBillPayments" />
#### findBillPayments(criteria, callback)
  
Finds all BillPayments in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of BillPayment


<a name="findBudgets" />
#### findBudgets(criteria, callback)
  
Finds all Budgets in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Budget


<a name="findClasses" />
#### findClasses(criteria, callback)
  
Finds all Classs in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Class


<a name="findCompanyInfos" />
#### findCompanyInfos(criteria, callback)
  
Finds all CompanyInfos in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of CompanyInfo


<a name="findCreditMemos" />
#### findCreditMemos(criteria, callback)
  
Finds all CreditMemos in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of CreditMemo


<a name="findCustomers" />
#### findCustomers(criteria, callback)
  
Finds all Customers in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Customer


<a name="findDepartments" />
#### findDepartments(criteria, callback)
  
Finds all Departments in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Department


<a name="findEmployees" />
#### findEmployees(criteria, callback)
  
Finds all Employees in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Employee


<a name="findEstimates" />
#### findEstimates(criteria, callback)
  
Finds all Estimates in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Estimate


<a name="findInvoices" />
#### findInvoices(criteria, callback)
  
Finds all Invoices in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Invoice


<a name="findItems" />
#### findItems(criteria, callback)
  
Finds all Items in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Item


<a name="findJournalEntries" />
#### findJournalEntries(criteria, callback)
  
Finds all JournalEntrys in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of JournalEntry


<a name="findPayments" />
#### findPayments(criteria, callback)
  
Finds all Payments in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Payment


<a name="findPaymentMethods" />
#### findPaymentMethods(criteria, callback)
  
Finds all PaymentMethods in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of PaymentMethod


<a name="findPreferenceses" />
#### findPreferenceses(criteria, callback)
  
Finds all Preferencess in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Preferences


<a name="findPurchases" />
#### findPurchases(criteria, callback)
  
Finds all Purchases in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Purchase


<a name="findPurchaseOrders" />
#### findPurchaseOrders(criteria, callback)
  
Finds all PurchaseOrders in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of PurchaseOrder


<a name="findRefundReceipts" />
#### findRefundReceipts(criteria, callback)
  
Finds all RefundReceipts in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of RefundReceipt


<a name="findSalesReceipts" />
#### findSalesReceipts(criteria, callback)
  
Finds all SalesReceipts in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of SalesReceipt


<a name="findTaxAgencies" />
#### findTaxAgencies(criteria, callback)
  
Finds all TaxAgencys in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of TaxAgency


<a name="findTaxCodes" />
#### findTaxCodes(criteria, callback)
  
Finds all TaxCodes in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of TaxCode


<a name="findTaxRates" />
#### findTaxRates(criteria, callback)
  
Finds all TaxRates in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of TaxRate


<a name="findTerms" />
#### findTerms(criteria, callback)
  
Finds all Terms in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Term


<a name="findTimeActivities" />
#### findTimeActivities(criteria, callback)
  
Finds all TimeActivitys in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of TimeActivity


<a name="findVendors" />
#### findVendors(criteria, callback)
  
Finds all Vendors in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of Vendor


<a name="findVendorCredits" />
#### findVendorCredits(criteria, callback)
  
Finds all VendorCredits in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form "where key = 'value'"
* `callback` - Callback function which is called with any error and the list of VendorCredit




<a name="reportBalanceSheet" />
#### reportBalanceSheet(options, callback)
  
Retrieves the BalanceSheet Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the BalanceSheet Report


<a name="reportProfitAndLoss" />
#### reportProfitAndLoss(options, callback)
  
Retrieves the ProfitAndLoss Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the ProfitAndLoss Report


<a name="reportProfitAndLossDetail" />
#### reportProfitAndLossDetail(options, callback)
  
Retrieves the ProfitAndLossDetail Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the ProfitAndLossDetail Report


<a name="reportTrialBalance" />
#### reportTrialBalance(options, callback)
  
Retrieves the TrialBalance Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the TrialBalance Report


<a name="reportCashFlow" />
#### reportCashFlow(options, callback)
  
Retrieves the CashFlow Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the CashFlow Report


<a name="reportInventoryValuationSummary" />
#### reportInventoryValuationSummary(options, callback)
  
Retrieves the InventoryValuationSummary Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the InventoryValuationSummary Report


<a name="reportCustomerSales" />
#### reportCustomerSales(options, callback)
  
Retrieves the CustomerSales Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the CustomerSales Report


<a name="reportItemSales" />
#### reportItemSales(options, callback)
  
Retrieves the ItemSales Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the ItemSales Report


<a name="reportCustomerIncome" />
#### reportCustomerIncome(options, callback)
  
Retrieves the CustomerIncome Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the CustomerIncome Report


<a name="reportCustomerBalance" />
#### reportCustomerBalance(options, callback)
  
Retrieves the CustomerBalance Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the CustomerBalance Report


<a name="reportCustomerBalanceDetail" />
#### reportCustomerBalanceDetail(options, callback)
  
Retrieves the CustomerBalanceDetail Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the CustomerBalanceDetail Report


<a name="reportAgedReceivables" />
#### reportAgedReceivables(options, callback)
  
Retrieves the AgedReceivables Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the AgedReceivables Report


<a name="reportAgedReceivableDetail" />
#### reportAgedReceivableDetail(options, callback)
  
Retrieves the AgedReceivableDetail Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the AgedReceivableDetail Report


<a name="reportVendorBalance" />
#### reportVendorBalance(options, callback)
  
Retrieves the VendorBalance Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the VendorBalance Report


<a name="reportVendorBalanceDetail" />
#### reportVendorBalanceDetail(options, callback)
  
Retrieves the VendorBalanceDetail Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the VendorBalanceDetail Report


<a name="reportAgedPayables" />
#### reportAgedPayables(options, callback)
  
Retrieves the AgedPayables Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the AgedPayables Report


<a name="reportAgedPayableDetail" />
#### reportAgedPayableDetail(options, callback)
  
Retrieves the AgedPayableDetail Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the AgedPayableDetail Report


<a name="reportVendorExpenses" />
#### reportVendorExpenses(options, callback)
  
Retrieves the VendorExpenses Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the VendorExpenses Report


<a name="reportGeneralLedgerDetail" />
#### reportGeneralLedgerDetail(options, callback)
  
Retrieves the GeneralLedgerDetail Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the GeneralLedgerDetail Report


<a name="reportDepartmentSales" />
#### reportDepartmentSales(options, callback)
  
Retrieves the DepartmentSales Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the DepartmentSales Report


<a name="reportClassSales" />
#### reportClassSales(options, callback)
  
Retrieves the ClassSales Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the ClassSales Report

[1]: https://developer.intuit.com/docs/0025_quickbooksapi/0050_data_services
[2]: http://blog.fogus.me/2012/08/23/minimum-viable-snippet/