(ns generator.core)

(defn upper [e]
  (str (.toUpperCase (.substring e 0 1)) 
       (.substring e 1)))

(defn pluralize [s]
  (if (.endsWith s "s")
      (str s "es")
      (if (.endsWith s "y")
          (str (.substring s 0 (- (.length s) 1)) "ies")
          (str s "s"))))

(defn create [e]
  (str "/**
 * Creates the " (upper e) " in Quickbooks 
 *
 * @param  {object} " e " - The unsaved " e ", to be persisted in Quickbooks
 * @param  {function} callback - Callback function which is called with any error and the persistent " (upper e) "
 */\n"
 "Quickbooks.prototype.create" (upper e) " = function(" (.trim e) ", callback) {
  this.create('" (.trim e) "', " (.trim e) ", callback)\n}\n\n"))

(defn retrieve [e]
  (str "/**
 * Retrieves the " (upper e) " from Quickbooks
 *
 * @param  {string} Id - The Id of persistent " (upper e) "
 * @param  {function} callback - Callback function which is called with any error and the persistent " (upper e) "
 */\n"
 "Quickbooks.prototype.get" (upper e) " = function(id, callback) {
  this.read('" (.trim e) "', id, callback)\n}\n\n"))

(defn update [e]
  (str "/**
 * Updates Quickbooks version of " (upper e) "
 *
 * @param  {object} " e " - The persistent " (upper e) ", including Id and SyncToken fields
 * @param  {function} callback - Callback function which is called with any error and the persistent " (upper e) "
 */\n"
 "Quickbooks.prototype.update" (upper e) " = function(" (.trim e) ", callback) {
  this.update('" (.trim e) "', " (.trim e) ", callback)\n}\n\n"))

(defn delete [e]
  (str "/**
 * Deletes the " (upper e) " from Quickbooks
 *
 * @param  {object} idOrEntity - The persistent " (upper e) " to be deleted, or the Id of the " (upper e) ", in which case an extra GET request will be issued to first retrieve the " (upper e) " 
 * @param  {function} callback - Callback function which is called with any error and the status of the persistent " (upper e) "
 */\n"
 "Quickbooks.prototype.delete" (upper e) " = function(idOrEntity, callback) {
  this.delete('" (.trim e) "', idOrEntity, callback)\n}\n\n"))

(defn query [e]
  (str "/**
 * Finds all " (upper e) "s in Quickbooks, optionally matching the specified criteria
 *
 * @param  {object} criteria - (Optional) String or single-valued map converted to a where clause of the form \"where key = 'value'\"
 * @param  {function} callback - Callback function which is called with any error and the list of " (upper e) "
 */\n"
 "Quickbooks.prototype.find" (pluralize (upper e)) " = function(criteria, callback) {
  this.query('" (.trim e) "', criteria, callback)\n}\n\n"))

(defn report [e]
  (str "/**
 * Retrieves the " (upper e) " Report from Quickbooks
 *
 * @param  {object} options - (Optional) Map of key-value pairs passed as options to the Report
 * @param  {function} callback - Callback function which is called with any error and the " (upper e) " Report
 */\n"
 "Quickbooks.prototype.report" (upper e) " = function(options, callback) {
  this.report('" (.trim e) "', options, callback)\n}\n\n"))


(defn gh-link-create [e] (str "* [`create" (upper e) "`](#create" (upper e) ")\n" ))
(defn gh-create [e]
  (str "<a name=\"create" (upper e) "\" />
#### create" (upper e) "(object, callback)
  
Creates the " (upper e) " in Quickbooks 
 
__Arguments__

* `object` - The unsaved " e ", to be persisted in Quickbooks
* `callback` - Callback function which is called with any error and the persistent " (upper e) "\n\n\n"))


(defn gh-link-retrieve [e] (str "* [`get" (upper e) "`](#get" (upper e) ")\n" ))
(defn gh-retrieve [e]
  (str "<a name=\"get" (upper e) "\" />
#### get" (upper e) "(id, callback)
  
Retrieves the " (upper e) " from Quickbooks
 
__Arguments__

* `id` - The Id of persistent " (upper e) "
* `callback` - Callback function which is called with any error and the persistent " (upper e) "\n\n\n"))


(defn gh-link-update [e] (str "* [`update" (upper e) "`](#update" (upper e) ")\n" ))
(defn gh-update [e]
  (str "<a name=\"update" (upper e) "\" />
#### update" (upper e) "(object, callback)
  
Updates Quickbooks version of " (upper e) "
 
__Arguments__

* `object` - The persistent " (upper e) ", including Id and SyncToken fields
* `callback` - Callback function which is called with any error and the updated " (upper e) "\n\n\n"))

  
(defn gh-link-delete [e] (str "* [`delete" (upper e) "`](#delete" (upper e) ")\n" ))
(defn gh-delete [e]
  (str "<a name=\"delete" (upper e) "\" />
#### delete" (upper e) "(idOrEntity, callback)
  
Deletes the " (upper e) " from Quickbooks
 
__Arguments__

* `idOrEntity` - The persistent " (upper e) " to be deleted, or the Id of the " (upper e) ", in which case an extra GET request will be issued to first retrieve the " (upper e) " 
* `callback` - Callback function which is called with any error and the status of the persistent " (upper e) "\n\n\n"))
  

(defn gh-link-query [e] (str "* [`find" (pluralize (upper e)) "`](#find" (pluralize (upper e)) ")\n" ))
(defn gh-query [e]
  (str "<a name=\"find" (pluralize (upper e)) "\" />
#### find" (pluralize (upper e)) "(criteria, callback)
  
Finds all " (upper e) "s in Quickbooks, optionally matching the specified criteria
 
__Arguments__

* `criteria` - (Optional) String or single-valued map converted to a where clause of the form \"where key = 'value'\"
* `callback` - Callback function which is called with any error and the list of " (upper e) "\n\n\n"))
  
  
(defn gh-link-report [e] (str "* [`report" (upper e) "`](#report" (upper e) ")\n" ))
(defn gh-report [e]
  (str "<a name=\"report" (upper e) "\" />
#### report" (upper e) "(options, callback)
  
Retrieves the " (upper e) " Report from Quickbooks
 
__Arguments__

* `options` - (Optional) Map of key-value pairs passed as options to the Report
* `callback` - Callback function which is called with any error and the " (upper e) " Report\n\n\n"))
  
  
(defn write [buffer type]
  (->> (reduce
         (fn [m e]
           (let [nmsp (-> "generator.core" symbol find-ns)
                 func (->> type name (str "gh-") symbol (ns-resolve nmsp))
                 funk (->> type name (str "gh-link-") symbol (ns-resolve nmsp))]
             (if-not (or (empty? e) (.startsWith e "#"))
               (do (.append (first m) (func e))
                   (.append (last m) (funk e))))
             m))
         buffer
         (.split (slurp (str "../" (name type) ".txt")) "\n"))
         .toString))

(defn generate []
  (->> (reduce
         (fn [buffer type]
           (write buffer type)
           (.append (first buffer) "\n\n")
           buffer)
         [(StringBuffer.) (StringBuffer.)]
         [:create :retrieve :update :delete :query :report])
       first
       .toString
       (spit (str "../generated.txt"))))
