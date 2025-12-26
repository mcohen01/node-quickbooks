// ============================================
// CALLBACK AND ERROR TYPES
// ============================================

export type QuickBooksCallback<T> = (
  err: QuickBooksError | null,
  data?: T,
  res?: any
) => void;

export interface QuickBooksError {
  fault?: {
    error?: Array<{
      Message?: string;
      Detail?: string;
      code?: string;
      element?: string;
    }>;
    type?: string;
  };
  message?: string;
  [key: string]: any;
}

// ============================================
// COMMON TYPES
// ============================================

export interface Ref {
  value: string;
  name?: string;
}

export interface QueryCriteria {
  field?: string;
  value?: any;
  operator?: '=' | 'IN' | '<' | '>' | '<=' | '>=' | 'LIKE';
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  desc?: string;
  asc?: string;
  count?: boolean;
  [key: string]: any;
}

export interface QueryResponse<T> {
  QueryResponse?: {
    [key: string]: T[] | number | undefined;
    maxResults?: number;
    startPosition?: number;
  };
  time?: string;
}

export interface EntityResponse<T> {
  [key: string]: T | string | undefined;
  time?: string;
}

export interface BatchItemRequest {
  bId: string;
  operation: 'create' | 'update' | 'delete' | 'query';
  [key: string]: any;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

// ============================================
// ENTITY TYPES
// ============================================

export interface Account {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  AccountType?: string;
  AccountSubType?: string;
  Active?: boolean;
  Classification?: string;
  [key: string]: any;
}

export interface Attachable {
  Id?: string;
  SyncToken?: string;
  FileName?: string;
  ContentType?: string;
  AttachableRef?: Array<{
    EntityRef?: Ref;
  }>;
  [key: string]: any;
}

export interface Bill {
  Id?: string;
  SyncToken?: string;
  VendorRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface BillPayment {
  Id?: string;
  SyncToken?: string;
  VendorRef?: Ref;
  PayType?: string;
  [key: string]: any;
}

export interface Budget {
  Id?: string;
  Name?: string;
  [key: string]: any;
}

export interface Class {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  Active?: boolean;
  [key: string]: any;
}

export interface CompanyInfo {
  Id?: string;
  SyncToken?: string;
  CompanyName?: string;
  [key: string]: any;
}

export interface CompanyCurrency {
  Id?: string;
  Code?: string;
  [key: string]: any;
}

export interface CreditMemo {
  Id?: string;
  SyncToken?: string;
  CustomerRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  BillEmail?: {
    Address?: string;
  };
  [key: string]: any;
}

export interface Customer {
  Id?: string;
  SyncToken?: string;
  DisplayName?: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  CurrencyRef?: Ref;
  Email?: {
    Address?: string;
  };
  [key: string]: any;
}

export interface CustomerType {
  Id?: string;
  Name?: string;
  [key: string]: any;
}

export interface Department {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  Active?: boolean;
  [key: string]: any;
}

export interface Deposit {
  Id?: string;
  SyncToken?: string;
  DepositToAccountRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface Employee {
  Id?: string;
  SyncToken?: string;
  DisplayName?: string;
  GivenName?: string;
  FamilyName?: string;
  [key: string]: any;
}

export interface Estimate {
  Id?: string;
  SyncToken?: string;
  CustomerRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  BillEmail?: {
    Address?: string;
  };
  [key: string]: any;
}

export interface Invoice {
  Id?: string;
  SyncToken?: string;
  CustomerRef?: Ref;
  CurrencyRef?: Ref;
  Line?: Array<{
    Description?: string;
    Amount?: number;
    DetailType?: string;
    SalesItemLineDetail?: {
      ItemRef?: Ref;
      ClassRef?: Ref;
      UnitPrice?: number;
      Qty?: number;
      TaxCodeRef?: Ref;
    };
    [key: string]: any;
  }>;
  BillEmail?: {
    Address?: string;
  };
  EmailStatus?: string;
  PrivateNote?: string;
  TxnDate?: string;
  DueDate?: string;
  DocNumber?: string;
  TotalAmt?: number;
  Balance?: number;
  [key: string]: any;
}

export interface Item {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  Type?: string;
  UnitPrice?: number;
  doNotUpdateAccountOnTxns?: boolean;
  [key: string]: any;
}

export interface JournalCode {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  Type?: string;
  [key: string]: any;
}

export interface JournalEntry {
  Id?: string;
  SyncToken?: string;
  Line?: Array<{
    Id?: string;
    Description?: string;
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface Payment {
  Id?: string;
  SyncToken?: string;
  CustomerRef?: Ref;
  TotalAmt?: number;
  void?: boolean;
  sparse?: boolean;
  [key: string]: any;
}

export interface PaymentMethod {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  Type?: string;
  Active?: boolean;
  [key: string]: any;
}

export interface Preferences {
  Id?: string;
  SyncToken?: string;
  [key: string]: any;
}

export interface Purchase {
  Id?: string;
  SyncToken?: string;
  AccountRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface PurchaseOrder {
  Id?: string;
  SyncToken?: string;
  VendorRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  POEmail?: {
    Address?: string;
  };
  [key: string]: any;
}

export interface RefundReceipt {
  Id?: string;
  SyncToken?: string;
  CustomerRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface SalesReceipt {
  Id?: string;
  SyncToken?: string;
  CustomerRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  BillEmail?: {
    Address?: string;
  };
  [key: string]: any;
}

export interface TaxAgency {
  Id?: string;
  SyncToken?: string;
  DisplayName?: string;
  [key: string]: any;
}

export interface TaxCode {
  Id?: string;
  Name?: string;
  [key: string]: any;
}

export interface TaxRate {
  Id?: string;
  Name?: string;
  [key: string]: any;
}

export interface Term {
  Id?: string;
  SyncToken?: string;
  Name?: string;
  [key: string]: any;
}

export interface TimeActivity {
  Id?: string;
  SyncToken?: string;
  NameOf?: string;
  EmployeeRef?: Ref;
  [key: string]: any;
}

export interface Transfer {
  Id?: string;
  SyncToken?: string;
  FromAccountRef?: Ref;
  ToAccountRef?: Ref;
  Amount?: number;
  [key: string]: any;
}

export interface Vendor {
  Id?: string;
  SyncToken?: string;
  DisplayName?: string;
  CompanyName?: string;
  [key: string]: any;
}

export interface VendorCredit {
  Id?: string;
  SyncToken?: string;
  VendorRef?: Ref;
  Line?: Array<{
    Amount?: number;
    DetailType?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface ExchangeRate {
  Id?: string;
  SyncToken?: string;
  SourceCurrencyCode?: string;
  TargetCurrencyCode?: string;
  Rate?: number;
  AsOfDate?: string;
  [key: string]: any;
}

export interface ReportOptions {
  start_date?: string;
  end_date?: string;
  accounting_method?: string;
  [key: string]: any;
}

// ============================================
// MAIN QUICKBOOKS CLASS
// ============================================

export class QuickBooks {
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string | false;
  realmId: string;
  useSandbox: boolean;
  debug?: boolean;
  minorversion: number | string;
  oauthversion: string;
  refreshToken?: string | null;
  endpoint: string;

  constructor(
    consumerKey: string,
    consumerSecret: string,
    oauthToken: string,
    oauthTokenSecret: string | false,
    realmId: string,
    useSandbox: boolean,
    debug?: boolean,
    minorversion?: string | null,
    oauthversion?: string,
    refreshToken?: string | null
  );

  // Static properties
  static APP_CENTER_BASE: string;
  static V3_ENDPOINT_BASE_URL: string;
  static QUERY_OPERATORS: string[];
  static TOKEN_URL: string;
  static REVOKE_URL: string;
  static setOauthVersion(version: string | number, useSandbox?: boolean): void;

  // OAuth methods
  refreshAccessToken(callback: QuickBooksCallback<RefreshTokenResponse>): void;
  revokeAccess(useRefresh: boolean, callback: QuickBooksCallback<any>): void;
  getUserInfo(callback: QuickBooksCallback<any>): void;

  // Connection methods
  reconnect(callback: QuickBooksCallback<any>): void;
  disconnect(callback: QuickBooksCallback<any>): void;

  // Batch operations
  batch(items: BatchItemRequest[], callback: QuickBooksCallback<any>): void;

  // Change data capture
  changeDataCapture(
    entities: string[] | string,
    since: Date | string,
    callback: QuickBooksCallback<any>
  ): void;

  // Upload
  upload(
    filename: string,
    contentType: string,
    stream: any,
    entityType?: string,
    entityId?: string,
    callback?: QuickBooksCallback<Attachable>
  ): void;

  // Query
  query(query: string, callback: QuickBooksCallback<any>): void;

  // ============================================
  // ACCOUNT METHODS
  // ============================================
  createAccount(
    account: Account,
    callback: QuickBooksCallback<EntityResponse<Account>>
  ): void;
  getAccount(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Account>>
  ): void;
  updateAccount(
    account: Account,
    callback: QuickBooksCallback<EntityResponse<Account>>
  ): void;
  findAccounts(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Account>>,
    callback?: QuickBooksCallback<QueryResponse<Account>>
  ): void;

  // ============================================
  // ATTACHABLE METHODS
  // ============================================
  createAttachable(
    attachable: Attachable,
    callback: QuickBooksCallback<EntityResponse<Attachable>>
  ): void;
  getAttachable(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Attachable>>
  ): void;
  updateAttachable(
    attachable: Attachable,
    callback: QuickBooksCallback<EntityResponse<Attachable>>
  ): void;
  deleteAttachable(
    idOrEntity: string | Attachable,
    callback: QuickBooksCallback<any>
  ): void;
  findAttachables(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Attachable>>,
    callback?: QuickBooksCallback<QueryResponse<Attachable>>
  ): void;

  // ============================================
  // BILL METHODS
  // ============================================
  createBill(
    bill: Bill,
    callback: QuickBooksCallback<EntityResponse<Bill>>
  ): void;
  getBill(id: string, callback: QuickBooksCallback<EntityResponse<Bill>>): void;
  updateBill(
    bill: Bill,
    callback: QuickBooksCallback<EntityResponse<Bill>>
  ): void;
  deleteBill(
    idOrEntity: string | Bill,
    callback: QuickBooksCallback<any>
  ): void;
  findBills(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Bill>>,
    callback?: QuickBooksCallback<QueryResponse<Bill>>
  ): void;

  // ============================================
  // BILL PAYMENT METHODS
  // ============================================
  createBillPayment(
    billPayment: BillPayment,
    callback: QuickBooksCallback<EntityResponse<BillPayment>>
  ): void;
  getBillPayment(
    id: string,
    callback: QuickBooksCallback<EntityResponse<BillPayment>>
  ): void;
  updateBillPayment(
    billPayment: BillPayment,
    callback: QuickBooksCallback<EntityResponse<BillPayment>>
  ): void;
  deleteBillPayment(
    idOrEntity: string | BillPayment,
    callback: QuickBooksCallback<any>
  ): void;
  findBillPayments(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<BillPayment>>,
    callback?: QuickBooksCallback<QueryResponse<BillPayment>>
  ): void;

  // ============================================
  // BUDGET METHODS
  // ============================================
  findBudgets(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Budget>>,
    callback?: QuickBooksCallback<QueryResponse<Budget>>
  ): void;

  // ============================================
  // CLASS METHODS
  // ============================================
  createClass(
    klass: Class,
    callback: QuickBooksCallback<EntityResponse<Class>>
  ): void;
  getClass(id: string, callback: QuickBooksCallback<EntityResponse<Class>>): void;
  updateClass(
    klass: Class,
    callback: QuickBooksCallback<EntityResponse<Class>>
  ): void;
  findClasses(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Class>>,
    callback?: QuickBooksCallback<QueryResponse<Class>>
  ): void;

  // ============================================
  // COMPANY INFO METHODS
  // ============================================
  getCompanyInfo(
    id: string,
    callback: QuickBooksCallback<EntityResponse<CompanyInfo>>
  ): void;
  updateCompanyInfo(
    companyInfo: CompanyInfo,
    callback: QuickBooksCallback<EntityResponse<CompanyInfo>>
  ): void;
  findCompanyInfos(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<CompanyInfo>>,
    callback?: QuickBooksCallback<QueryResponse<CompanyInfo>>
  ): void;

  // ============================================
  // COMPANY CURRENCY METHODS
  // ============================================
  getCompanyCurrency(
    id: string,
    callback: QuickBooksCallback<EntityResponse<CompanyCurrency>>
  ): void;
  findCompanyCurrencies(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<CompanyCurrency>>,
    callback?: QuickBooksCallback<QueryResponse<CompanyCurrency>>
  ): void;

  // ============================================
  // CREDIT MEMO METHODS
  // ============================================
  createCreditMemo(
    creditMemo: CreditMemo,
    callback: QuickBooksCallback<EntityResponse<CreditMemo>>
  ): void;
  getCreditMemo(
    id: string,
    callback: QuickBooksCallback<EntityResponse<CreditMemo>>
  ): void;
  updateCreditMemo(
    creditMemo: CreditMemo,
    callback: QuickBooksCallback<EntityResponse<CreditMemo>>
  ): void;
  deleteCreditMemo(
    idOrEntity: string | CreditMemo,
    callback: QuickBooksCallback<any>
  ): void;
  getCreditMemoPdf(
    id: string,
    callback: QuickBooksCallback<any>
  ): void;
  sendCreditMemoPdf(
    id: string,
    sendTo?: string,
    callback?: QuickBooksCallback<any>
  ): void;
  findCreditMemos(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<CreditMemo>>,
    callback?: QuickBooksCallback<QueryResponse<CreditMemo>>
  ): void;

  // ============================================
  // CUSTOMER METHODS
  // ============================================
  createCustomer(
    customer: Customer,
    callback: QuickBooksCallback<EntityResponse<Customer>>
  ): void;
  getCustomer(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Customer>>
  ): void;
  updateCustomer(
    customer: Customer,
    callback: QuickBooksCallback<EntityResponse<Customer>>
  ): void;
  findCustomers(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Customer>>,
    callback?: QuickBooksCallback<QueryResponse<Customer>>
  ): void;

  // ============================================
  // CUSTOMER TYPE METHODS
  // ============================================
  getCustomerType(
    id: string,
    callback: QuickBooksCallback<EntityResponse<CustomerType>>
  ): void;
  findCustomerTypes(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<CustomerType>>,
    callback?: QuickBooksCallback<QueryResponse<CustomerType>>
  ): void;

  // ============================================
  // DEPARTMENT METHODS
  // ============================================
  createDepartment(
    department: Department,
    callback: QuickBooksCallback<EntityResponse<Department>>
  ): void;
  getDepartment(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Department>>
  ): void;
  updateDepartment(
    department: Department,
    callback: QuickBooksCallback<EntityResponse<Department>>
  ): void;
  findDepartments(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Department>>,
    callback?: QuickBooksCallback<QueryResponse<Department>>
  ): void;

  // ============================================
  // DEPOSIT METHODS
  // ============================================
  createDeposit(
    deposit: Deposit,
    callback: QuickBooksCallback<EntityResponse<Deposit>>
  ): void;
  getDeposit(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Deposit>>
  ): void;
  updateDeposit(
    deposit: Deposit,
    callback: QuickBooksCallback<EntityResponse<Deposit>>
  ): void;
  deleteDeposit(
    idOrEntity: string | Deposit,
    callback: QuickBooksCallback<any>
  ): void;
  findDeposits(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Deposit>>,
    callback?: QuickBooksCallback<QueryResponse<Deposit>>
  ): void;

  // ============================================
  // EMPLOYEE METHODS
  // ============================================
  createEmployee(
    employee: Employee,
    callback: QuickBooksCallback<EntityResponse<Employee>>
  ): void;
  getEmployee(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Employee>>
  ): void;
  updateEmployee(
    employee: Employee,
    callback: QuickBooksCallback<EntityResponse<Employee>>
  ): void;
  findEmployees(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Employee>>,
    callback?: QuickBooksCallback<QueryResponse<Employee>>
  ): void;

  // ============================================
  // ESTIMATE METHODS
  // ============================================
  createEstimate(
    estimate: Estimate,
    callback: QuickBooksCallback<EntityResponse<Estimate>>
  ): void;
  getEstimate(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Estimate>>
  ): void;
  updateEstimate(
    estimate: Estimate,
    callback: QuickBooksCallback<EntityResponse<Estimate>>
  ): void;
  deleteEstimate(
    idOrEntity: string | Estimate,
    callback: QuickBooksCallback<any>
  ): void;
  getEstimatePdf(
    id: string,
    callback: QuickBooksCallback<any>
  ): void;
  sendEstimatePdf(
    id: string,
    sendTo?: string,
    callback?: QuickBooksCallback<any>
  ): void;
  findEstimates(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Estimate>>,
    callback?: QuickBooksCallback<QueryResponse<Estimate>>
  ): void;

  // ============================================
  // EXCHANGE RATE METHODS
  // ============================================
  getExchangeRate(
    options: { sourcecurrencycode: string; asofdate?: string },
    callback: QuickBooksCallback<EntityResponse<ExchangeRate>>
  ): void;
  updateExchangeRate(
    exchangeRate: ExchangeRate,
    callback: QuickBooksCallback<EntityResponse<ExchangeRate>>
  ): void;
  findExchangeRates(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<ExchangeRate>>,
    callback?: QuickBooksCallback<QueryResponse<ExchangeRate>>
  ): void;

  // ============================================
  // INVOICE METHODS
  // ============================================
  createInvoice(
    invoice: Invoice,
    callback: QuickBooksCallback<EntityResponse<Invoice>>
  ): void;
  getInvoice(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Invoice>>
  ): void;
  updateInvoice(
    invoice: Invoice,
    callback: QuickBooksCallback<EntityResponse<Invoice>>
  ): void;
  deleteInvoice(
    idOrEntity: string | Invoice,
    callback: QuickBooksCallback<any>
  ): void;
  voidInvoice(
    idOrEntity: string | Invoice,
    callback: QuickBooksCallback<EntityResponse<Invoice>>
  ): void;
  getInvoicePdf(id: string, callback: QuickBooksCallback<any>): void;
  sendInvoicePdf(
    id: string,
    sendTo?: string,
    callback?: QuickBooksCallback<any>
  ): void;
  findInvoices(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Invoice>>,
    callback?: QuickBooksCallback<QueryResponse<Invoice>>
  ): void;

  // ============================================
  // ITEM METHODS
  // ============================================
  createItem(
    item: Item,
    callback: QuickBooksCallback<EntityResponse<Item>>
  ): void;
  getItem(id: string, callback: QuickBooksCallback<EntityResponse<Item>>): void;
  updateItem(
    item: Item,
    callback: QuickBooksCallback<EntityResponse<Item>>
  ): void;
  findItems(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Item>>,
    callback?: QuickBooksCallback<QueryResponse<Item>>
  ): void;

  // ============================================
  // JOURNAL CODE METHODS
  // ============================================
  createJournalCode(
    journalCode: JournalCode,
    callback: QuickBooksCallback<EntityResponse<JournalCode>>
  ): void;
  getJournalCode(
    id: string,
    callback: QuickBooksCallback<EntityResponse<JournalCode>>
  ): void;
  updateJournalCode(
    journalCode: JournalCode,
    callback: QuickBooksCallback<EntityResponse<JournalCode>>
  ): void;
  deleteJournalCode(
    idOrEntity: string | JournalCode,
    callback: QuickBooksCallback<any>
  ): void;
  findJournalCodes(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<JournalCode>>,
    callback?: QuickBooksCallback<QueryResponse<JournalCode>>
  ): void;

  // ============================================
  // JOURNAL ENTRY METHODS
  // ============================================
  createJournalEntry(
    journalEntry: JournalEntry,
    callback: QuickBooksCallback<EntityResponse<JournalEntry>>
  ): void;
  getJournalEntry(
    id: string,
    callback: QuickBooksCallback<EntityResponse<JournalEntry>>
  ): void;
  updateJournalEntry(
    journalEntry: JournalEntry,
    callback: QuickBooksCallback<EntityResponse<JournalEntry>>
  ): void;
  deleteJournalEntry(
    idOrEntity: string | JournalEntry,
    callback: QuickBooksCallback<any>
  ): void;
  findJournalEntries(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<JournalEntry>>,
    callback?: QuickBooksCallback<QueryResponse<JournalEntry>>
  ): void;

  // ============================================
  // PAYMENT METHODS
  // ============================================
  createPayment(
    payment: Payment,
    callback: QuickBooksCallback<EntityResponse<Payment>>
  ): void;
  getPayment(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Payment>>
  ): void;
  updatePayment(
    payment: Payment,
    callback: QuickBooksCallback<EntityResponse<Payment>>
  ): void;
  deletePayment(
    idOrEntity: string | Payment,
    callback: QuickBooksCallback<any>
  ): void;
  voidPayment(
    payment: Payment,
    callback: QuickBooksCallback<EntityResponse<Payment>>
  ): void;
  findPayments(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Payment>>,
    callback?: QuickBooksCallback<QueryResponse<Payment>>
  ): void;

  // ============================================
  // PAYMENT METHOD METHODS
  // ============================================
  createPaymentMethod(
    paymentMethod: PaymentMethod,
    callback: QuickBooksCallback<EntityResponse<PaymentMethod>>
  ): void;
  getPaymentMethod(
    id: string,
    callback: QuickBooksCallback<EntityResponse<PaymentMethod>>
  ): void;
  updatePaymentMethod(
    paymentMethod: PaymentMethod,
    callback: QuickBooksCallback<EntityResponse<PaymentMethod>>
  ): void;
  findPaymentMethods(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<PaymentMethod>>,
    callback?: QuickBooksCallback<QueryResponse<PaymentMethod>>
  ): void;

  // ============================================
  // PREFERENCES METHODS
  // ============================================
  getPreferences(
    callback: QuickBooksCallback<EntityResponse<Preferences>>
  ): void;
  updatePreferences(
    preferences: Preferences,
    callback: QuickBooksCallback<EntityResponse<Preferences>>
  ): void;
  findPreferenceses(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Preferences>>,
    callback?: QuickBooksCallback<QueryResponse<Preferences>>
  ): void;

  // ============================================
  // PURCHASE METHODS
  // ============================================
  createPurchase(
    purchase: Purchase,
    callback: QuickBooksCallback<EntityResponse<Purchase>>
  ): void;
  getPurchase(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Purchase>>
  ): void;
  updatePurchase(
    purchase: Purchase,
    callback: QuickBooksCallback<EntityResponse<Purchase>>
  ): void;
  deletePurchase(
    idOrEntity: string | Purchase,
    callback: QuickBooksCallback<any>
  ): void;
  findPurchases(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Purchase>>,
    callback?: QuickBooksCallback<QueryResponse<Purchase>>
  ): void;

  // ============================================
  // PURCHASE ORDER METHODS
  // ============================================
  createPurchaseOrder(
    purchaseOrder: PurchaseOrder,
    callback: QuickBooksCallback<EntityResponse<PurchaseOrder>>
  ): void;
  getPurchaseOrder(
    id: string,
    callback: QuickBooksCallback<EntityResponse<PurchaseOrder>>
  ): void;
  updatePurchaseOrder(
    purchaseOrder: PurchaseOrder,
    callback: QuickBooksCallback<EntityResponse<PurchaseOrder>>
  ): void;
  deletePurchaseOrder(
    idOrEntity: string | PurchaseOrder,
    callback: QuickBooksCallback<any>
  ): void;
  sendPurchaseOrder(
    id: string,
    sendTo?: string,
    callback?: QuickBooksCallback<any>
  ): void;
  findPurchaseOrders(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<PurchaseOrder>>,
    callback?: QuickBooksCallback<QueryResponse<PurchaseOrder>>
  ): void;

  // ============================================
  // REFUND RECEIPT METHODS
  // ============================================
  createRefundReceipt(
    refundReceipt: RefundReceipt,
    callback: QuickBooksCallback<EntityResponse<RefundReceipt>>
  ): void;
  getRefundReceipt(
    id: string,
    callback: QuickBooksCallback<EntityResponse<RefundReceipt>>
  ): void;
  updateRefundReceipt(
    refundReceipt: RefundReceipt,
    callback: QuickBooksCallback<EntityResponse<RefundReceipt>>
  ): void;
  deleteRefundReceipt(
    idOrEntity: string | RefundReceipt,
    callback: QuickBooksCallback<any>
  ): void;
  findRefundReceipts(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<RefundReceipt>>,
    callback?: QuickBooksCallback<QueryResponse<RefundReceipt>>
  ): void;

  // ============================================
  // SALES RECEIPT METHODS
  // ============================================
  createSalesReceipt(
    salesReceipt: SalesReceipt,
    callback: QuickBooksCallback<EntityResponse<SalesReceipt>>
  ): void;
  getSalesReceipt(
    id: string,
    callback: QuickBooksCallback<EntityResponse<SalesReceipt>>
  ): void;
  updateSalesReceipt(
    salesReceipt: SalesReceipt,
    callback: QuickBooksCallback<EntityResponse<SalesReceipt>>
  ): void;
  deleteSalesReceipt(
    idOrEntity: string | SalesReceipt,
    callback: QuickBooksCallback<any>
  ): void;
  getSalesReceiptPdf(
    id: string,
    callback: QuickBooksCallback<any>
  ): void;
  sendSalesReceiptPdf(
    id: string,
    sendTo?: string,
    callback?: QuickBooksCallback<any>
  ): void;
  findSalesReceipts(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<SalesReceipt>>,
    callback?: QuickBooksCallback<QueryResponse<SalesReceipt>>
  ): void;

  // ============================================
  // TAX AGENCY METHODS
  // ============================================
  createTaxAgency(
    taxAgency: TaxAgency,
    callback: QuickBooksCallback<EntityResponse<TaxAgency>>
  ): void;
  getTaxAgency(
    id: string,
    callback: QuickBooksCallback<EntityResponse<TaxAgency>>
  ): void;
  updateTaxAgency(
    taxAgency: TaxAgency,
    callback: QuickBooksCallback<EntityResponse<TaxAgency>>
  ): void;
  findTaxAgencies(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<TaxAgency>>,
    callback?: QuickBooksCallback<QueryResponse<TaxAgency>>
  ): void;

  // ============================================
  // TAX CODE METHODS
  // ============================================
  getTaxCode(
    id: string,
    callback: QuickBooksCallback<EntityResponse<TaxCode>>
  ): void;
  updateTaxCode(
    taxCode: TaxCode,
    callback: QuickBooksCallback<EntityResponse<TaxCode>>
  ): void;
  findTaxCodes(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<TaxCode>>,
    callback?: QuickBooksCallback<QueryResponse<TaxCode>>
  ): void;

  // ============================================
  // TAX RATE METHODS
  // ============================================
  getTaxRate(
    id: string,
    callback: QuickBooksCallback<EntityResponse<TaxRate>>
  ): void;
  updateTaxRate(
    taxRate: TaxRate,
    callback: QuickBooksCallback<EntityResponse<TaxRate>>
  ): void;
  findTaxRates(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<TaxRate>>,
    callback?: QuickBooksCallback<QueryResponse<TaxRate>>
  ): void;

  // ============================================
  // TAX SERVICE METHODS
  // ============================================
  createTaxService(
    taxService: any,
    callback: QuickBooksCallback<any>
  ): void;

  // ============================================
  // TERM METHODS
  // ============================================
  createTerm(
    term: Term,
    callback: QuickBooksCallback<EntityResponse<Term>>
  ): void;
  getTerm(id: string, callback: QuickBooksCallback<EntityResponse<Term>>): void;
  updateTerm(
    term: Term,
    callback: QuickBooksCallback<EntityResponse<Term>>
  ): void;
  findTerms(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Term>>,
    callback?: QuickBooksCallback<QueryResponse<Term>>
  ): void;

  // ============================================
  // TIME ACTIVITY METHODS
  // ============================================
  createTimeActivity(
    timeActivity: TimeActivity,
    callback: QuickBooksCallback<EntityResponse<TimeActivity>>
  ): void;
  getTimeActivity(
    id: string,
    callback: QuickBooksCallback<EntityResponse<TimeActivity>>
  ): void;
  updateTimeActivity(
    timeActivity: TimeActivity,
    callback: QuickBooksCallback<EntityResponse<TimeActivity>>
  ): void;
  deleteTimeActivity(
    idOrEntity: string | TimeActivity,
    callback: QuickBooksCallback<any>
  ): void;
  findTimeActivities(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<TimeActivity>>,
    callback?: QuickBooksCallback<QueryResponse<TimeActivity>>
  ): void;

  // ============================================
  // TRANSFER METHODS
  // ============================================
  createTransfer(
    transfer: Transfer,
    callback: QuickBooksCallback<EntityResponse<Transfer>>
  ): void;
  getTransfer(
    id: string,
    callback: QuickBooksCallback<EntityResponse<Transfer>>
  ): void;
  updateTransfer(
    transfer: Transfer,
    callback: QuickBooksCallback<EntityResponse<Transfer>>
  ): void;
  deleteTransfer(
    idOrEntity: string | Transfer,
    callback: QuickBooksCallback<any>
  ): void;
  findTransfers(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Transfer>>,
    callback?: QuickBooksCallback<QueryResponse<Transfer>>
  ): void;

  // ============================================
  // VENDOR METHODS
  // ============================================
  createVendor(
    vendor: Vendor,
    callback: QuickBooksCallback<EntityResponse<Vendor>>
  ): void;
  getVendor(id: string, callback: QuickBooksCallback<EntityResponse<Vendor>>): void;
  updateVendor(
    vendor: Vendor,
    callback: QuickBooksCallback<EntityResponse<Vendor>>
  ): void;
  findVendors(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<Vendor>>,
    callback?: QuickBooksCallback<QueryResponse<Vendor>>
  ): void;

  // ============================================
  // VENDOR CREDIT METHODS
  // ============================================
  createVendorCredit(
    vendorCredit: VendorCredit,
    callback: QuickBooksCallback<EntityResponse<VendorCredit>>
  ): void;
  getVendorCredit(
    id: string,
    callback: QuickBooksCallback<EntityResponse<VendorCredit>>
  ): void;
  updateVendorCredit(
    vendorCredit: VendorCredit,
    callback: QuickBooksCallback<EntityResponse<VendorCredit>>
  ): void;
  deleteVendorCredit(
    idOrEntity: string | VendorCredit,
    callback: QuickBooksCallback<any>
  ): void;
  findVendorCredits(
    criteria: QueryCriteria | QuickBooksCallback<QueryResponse<VendorCredit>>,
    callback?: QuickBooksCallback<QueryResponse<VendorCredit>>
  ): void;

  // ============================================
  // REPORTS METHODS
  // ============================================
  getReports(
    id: string,
    callback: QuickBooksCallback<any>
  ): void;
  reportBalanceSheet(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportProfitAndLoss(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportProfitAndLossDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTrialBalance(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTrialBalanceFR(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportCashFlow(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportInventoryValuationSummary(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportCustomerSales(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportItemSales(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportCustomerIncome(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportCustomerBalance(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportCustomerBalanceDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportAgedReceivables(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportAgedReceivableDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportVendorBalance(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportVendorBalanceDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportAgedPayables(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportAgedPayableDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportVendorExpenses(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTransactionList(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTransactionListWithSplits(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTransactionListByCustomer(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTransactionListByVendor(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportGeneralLedgerDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportTaxSummary(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportDepartmentSales(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportClassSales(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportAccountListDetail(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;
  reportJournalReport(
    options: ReportOptions | QuickBooksCallback<any>,
    callback?: QuickBooksCallback<any>
  ): void;

  // Utility methods
  capitalize(s: string): string;
  pluralize(s: string): string;
}

export default QuickBooks;
