/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Extension Manager.
 *
 * The Initial Developer of the Original Code is Ben Goodger.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Ben Goodger <ben@mozilla.org> (Google Inc.)
 *  Benjamin Smedberg <benjamin@smedbergs.us>
 *  Jens Bannmann <jens.b@web.de>
 *  Robert Strong <robert.bugzilla@gmail.com>
 *  Dave Townsend <dave.townsend@blueprintit.co.uk>
 *  Daniel Veditz <dveditz@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

//
// TODO:
// - better logging
//

const nsIExtensionManager             = Components.interfaces.nsIExtensionManager;
const nsIAddonUpdateCheckListener     = Components.interfaces.nsIAddonUpdateCheckListener;
const nsIUpdateItem                   = Components.interfaces.nsIUpdateItem;
const nsILocalFile                    = Components.interfaces.nsILocalFile;
const nsILineInputStream              = Components.interfaces.nsILineInputStream;
const nsIInstallLocation              = Components.interfaces.nsIInstallLocation;
const nsIURL                          = Components.interfaces.nsIURL
// XXXrstrong calling hasMoreElements on a nsIDirectoryEnumerator after
// it has been removed will cause a crash on Mac OS X - bug 292823
const nsIDirectoryEnumerator          = Components.interfaces.nsIDirectoryEnumerator;

const PREF_EM_CHECK_COMPATIBILITY     = "extensions.checkCompatibility";
const PREF_EM_LAST_APP_VERSION        = "extensions.lastAppVersion";
const PREF_UPDATE_COUNT               = "extensions.update.count";
const PREF_UPDATE_DEFAULT_URL         = "extensions.update.url";
const PREF_EM_IGNOREMTIMECHANGES      = "extensions.ignoreMTimeChanges";
const PREF_EM_DISABLEDOBSOLETE        = "extensions.disabledObsolete";
const PREF_EM_LAST_SELECTED_SKIN      = "extensions.lastSelectedSkin";
const PREF_EM_EXTENSION_FORMAT        = "extensions.%UUID%.";
const PREF_EM_ITEM_UPDATE_ENABLED     = "extensions.%UUID%.update.enabled";
const PREF_EM_UPDATE_ENABLED          = "extensions.update.enabled";
const PREF_EM_ITEM_UPDATE_URL         = "extensions.%UUID%.update.url";
const PREF_EM_DSS_ENABLED             = "extensions.dss.enabled";
const PREF_DSS_SWITCHPENDING          = "extensions.dss.switchPending";
const PREF_DSS_SKIN_TO_SELECT         = "extensions.lastSelectedSkin";
const PREF_GENERAL_SKINS_SELECTEDSKIN = "general.skins.selectedSkin";
const PREF_EM_LOGGING_ENABLED         = "extensions.logging.enabled";
const PREF_EM_UPDATE_INTERVAL         = "extensions.update.interval";
const PREF_BLOCKLIST_URL              = "extensions.blocklist.url";
const PREF_BLOCKLIST_DETAILS_URL      = "extensions.blocklist.detailsURL";
const PREF_BLOCKLIST_ENABLED          = "extensions.blocklist.enabled";
const PREF_BLOCKLIST_INTERVAL         = "extensions.blocklist.interval";
const PREF_UPDATE_NOTIFYUSER          = "extensions.update.notifyUser";
const PREF_GENERAL_USERAGENT_LOCALE   = "general.useragent.locale";
const PREF_PARTNER_BRANCH             = "app.partner.";
const PREF_APP_UPDATE_CHANNEL         = "app.update.channel";

const DIR_EXTENSIONS                  = "extensions";
const DIR_CHROME                      = "chrome";
const DIR_STAGE                       = "staged-xpis";
const FILE_EXTENSIONS                 = "extensions.rdf";
const FILE_EXTENSION_MANIFEST         = "extensions.ini";
const FILE_EXTENSIONS_STARTUP_CACHE   = "extensions.cache";
const FILE_AUTOREG                    = ".autoreg";
const FILE_INSTALL_MANIFEST           = "install.rdf";
const FILE_CONTENTS_MANIFEST          = "contents.rdf";
const FILE_CHROME_MANIFEST            = "chrome.manifest";
const FILE_BLOCKLIST                  = "blocklist.xml";

const UNKNOWN_XPCOM_ABI               = "unknownABI";

const FILE_LOGFILE                    = "extensionmanager.log";

const FILE_DEFAULT_THEME_JAR          = "classic.jar";
const TOOLKIT_ID                      = "toolkit@mozilla.org"

const KEY_PROFILEDIR                  = "ProfD";
const KEY_PROFILEDS                   = "ProfDS";
const KEY_APPDIR                      = "XCurProcD";
const KEY_TEMPDIR                     = "TmpD";

const EM_ACTION_REQUESTED_TOPIC       = "em-action-requested";
const EM_ITEM_INSTALLED               = "item-installed";
const EM_ITEM_UPGRADED                = "item-upgraded";
const EM_ITEM_UNINSTALLED             = "item-uninstalled";
const EM_ITEM_ENABLED                 = "item-enabled";
const EM_ITEM_DISABLED                = "item-disabled";
const EM_ITEM_CANCEL                  = "item-cancel-action";

const OP_NONE                         = "";
const OP_NEEDS_INSTALL                = "needs-install";
const OP_NEEDS_UPGRADE                = "needs-upgrade";
const OP_NEEDS_UNINSTALL              = "needs-uninstall";
const OP_NEEDS_ENABLE                 = "needs-enable";
const OP_NEEDS_DISABLE                = "needs-disable";

const KEY_APP_PROFILE                 = "app-profile";
const KEY_APP_GLOBAL                  = "app-global";

const CATEGORY_INSTALL_LOCATIONS      = "extension-install-locations";

const PREFIX_NS_EM                    = "http://www.mozilla.org/2004/em-rdf#";
const PREFIX_NS_CHROME                = "http://www.mozilla.org/rdf/chrome#";
const PREFIX_ITEM_URI                 = "urn:mozilla:item:";
const PREFIX_EXTENSION                = "urn:mozilla:extension:";
const PREFIX_THEME                    = "urn:mozilla:theme:";
const RDFURI_INSTALL_MANIFEST_ROOT    = "urn:mozilla:install-manifest";
const RDFURI_ITEM_ROOT                = "urn:mozilla:item:root"
const RDFURI_DEFAULT_THEME            = "urn:mozilla:item:{972ce4c6-7e08-4474-a285-3208198ce6fd}";
const XMLURI_PARSE_ERROR              = "http://www.mozilla.org/newlayout/xml/parsererror.xml"
const XMLURI_BLOCKLIST                = "http://www.mozilla.org/2006/addons-blocklist";

const URI_GENERIC_ICON_XPINSTALL      = "chrome://mozapps/skin/xpinstall/xpinstallItemGeneric.png";
const URI_GENERIC_ICON_THEME          = "chrome://mozapps/skin/extensions/themeGeneric.png";
const URI_XPINSTALL_CONFIRM_DIALOG    = "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul";
const URI_FINALIZE_DIALOG             = "chrome://mozapps/content/extensions/finalize.xul";
const URI_EXTENSIONS_PROPERTIES       = "chrome://mozapps/locale/extensions/extensions.properties";
const URI_BRAND_PROPERTIES            = "chrome://branding/locale/brand.properties";
const URI_DOWNLOADS_PROPERTIES        = "chrome://mozapps/locale/downloads/downloads.properties";
const URI_EXTENSION_UPDATE_DIALOG     = "chrome://mozapps/content/extensions/update.xul";
const URI_EXTENSION_LIST_DIALOG       = "chrome://mozapps/content/extensions/list.xul";

const INSTALLERROR_SUCCESS               = 0;
const INSTALLERROR_INVALID_VERSION       = -1;
const INSTALLERROR_INVALID_GUID          = -2;
const INSTALLERROR_INCOMPATIBLE_VERSION  = -3;
const INSTALLERROR_PHONED_HOME           = -4;
const INSTALLERROR_INCOMPATIBLE_PLATFORM = -5;
const INSTALLERROR_BLOCKLISTED           = -6;

const MODE_RDONLY   = 0x01;
const MODE_WRONLY   = 0x02;
const MODE_CREATE   = 0x08;
const MODE_APPEND   = 0x10;
const MODE_TRUNCATE = 0x20;

const PERMS_FILE      = 0644;
const PERMS_DIRECTORY = 0755;

var gApp  = null;
var gPref = null;
var gRDF  = null;
var gOS   = null;
var gXPCOMABI             = null;
var gABI                  = null;
var gOSVersion            = null;
var gOSTarget             = null;
var gConsole              = null;
var gInstallManifestRoot  = null;
var gVersionChecker       = null;
var gLoggingEnabled       = null;
var gCheckCompatibility   = true;

/** 
 * Valid GUIDs fit this pattern.
 */
var gIDTest = /^(\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}|[a-z0-9-\._]*\@[a-z0-9-\._]+)$/i;

// shared code for suppressing bad cert dialogs
//@line 40 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/../../shared/src/badCertHandler.js"

/**
 * Only allow built-in certs for HTTPS connections.  See bug 340198.
 */
function checkCert(channel) {
  if (!channel.originalURI.schemeIs("https"))  // bypass
    return;

  const Ci = Components.interfaces;  
  var cert =
      channel.securityInfo.QueryInterface(Ci.nsISSLStatusProvider).
      SSLStatus.QueryInterface(Ci.nsISSLStatus).serverCert;

  var issuer = cert.issuer;
  while (issuer && !cert.equals(issuer)) {
    cert = issuer;
    issuer = cert.issuer;
  }

  if (!issuer || issuer.tokenName != "Builtin Object Token")
    throw "cert issuer is not built-in";
}

/**
 * This class implements nsIBadCertListener.  It's job is to prevent "bad cert"
 * security dialogs from being shown to the user.  It is better to simply fail
 * if the certificate is bad. See bug 304286.
 */
function BadCertHandler() {
}
BadCertHandler.prototype = {

  // nsIBadCertListener
  confirmUnknownIssuer: function(socketInfo, cert, certAddType) {
    LOG("EM BadCertHandler: Unknown issuer");
    return false;
  },

  confirmMismatchDomain: function(socketInfo, targetURL, cert) {
    LOG("EM BadCertHandler: Mismatched domain");
    return false;
  },

  confirmCertExpired: function(socketInfo, cert) {
    LOG("EM BadCertHandler: Expired certificate");
    return false;
  },

  notifyCrlNextupdate: function(socketInfo, targetURL, cert) {
  },

  // nsIChannelEventSink
  onChannelRedirect: function(oldChannel, newChannel, flags) {
    // make sure the certificate of the old channel checks out before we follow
    // a redirect from it.  See bug 340198.
    checkCert(oldChannel);
  },

  // nsIInterfaceRequestor
  getInterface: function(iid) {
    if (iid.equals(Components.interfaces.nsIBadCertListener) ||
        iid.equals(Components.interfaces.nsIChannelEventSink))
      return this;

    Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
    return null;
  },

  // nsISupports
  QueryInterface: function(iid) {
    if (!iid.equals(Components.interfaces.nsIBadCertListener) &&
        !iid.equals(Components.interfaces.nsIChannelEventSink) &&
        !iid.equals(Components.interfaces.nsIInterfaceRequestor) &&
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};
//@line 188 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"

/**
 * Creates a Version Checker object.
 * @returns A handle to the global Version Checker service.
 */
function getVersionChecker() {
  if (!gVersionChecker) {
    gVersionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                                .getService(Components.interfaces.nsIVersionComparator);
  }
  return gVersionChecker;
}

var BundleManager = { 
  /**
  * Creates and returns a String Bundle at the specified URI
  * @param   bundleURI
  *          The URI of the bundle to load
  * @returns A nsIStringBundle which was retrieved.
  */
  getBundle: function(bundleURI) {
    var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService);
    return sbs.createBundle(bundleURI);
  },
  
  _appName: "",
  
  /**
   * The Application's display name.
   */
  get appName() {
    if (!this._appName) {
      var brandBundle = this.getBundle(URI_BRAND_PROPERTIES)
      this._appName = brandBundle.GetStringFromName("brandShortName");
    }
    return this._appName;
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// Utility Functions
//
function EM_NS(property) {
  return PREFIX_NS_EM + property;
}

function CHROME_NS(property) {
  return PREFIX_NS_CHROME + property;
}

function EM_R(property) {
  return gRDF.GetResource(EM_NS(property));
}

function EM_L(literal) {
  return gRDF.GetLiteral(literal);
}

function EM_I(integer) {
  return gRDF.GetIntLiteral(integer);
}

function EM_D(integer) {
  return gRDF.GetDateLiteral(integer);
}

/**
 * Gets a preference value, handling the case where there is no default.
 * @param   func
 *          The name of the preference function to call, on nsIPrefBranch
 * @param   preference
 *          The name of the preference
 * @param   defaultValue
 *          The default value to return in the event the preference has 
 *          no setting
 * @returns The value of the preference, or undefined if there was no
 *          user or default value.
 */
function getPref(func, preference, defaultValue) {
  try {
    return gPref[func](preference);
  }
  catch (e) {
  }
  return defaultValue;
}

/**
 * Initializes a RDF Container at a URI in a datasource.
 * @param   datasource
 *          The datasource the container is in
 * @param   root
 *          The RDF Resource which is the root of the container.
 * @returns The nsIRDFContainer, initialized at the root.
 */
function getContainer(datasource, root) {
  var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                      .createInstance(Components.interfaces.nsIRDFContainer);
  ctr.Init(datasource, root);
  return ctr;
}

/**
 * Gets a RDF Resource for item with the given ID
 * @param   id
 *          The GUID of the item to construct a RDF resource to the 
 *          active item for
 * @returns The RDF Resource to the Active item. 
 */
function getResourceForID(id) {
  return gRDF.GetResource(PREFIX_ITEM_URI + id);
}

/**
 * Construct a nsIUpdateItem with the supplied metadata
 * ...
 */
function makeItem(id, version, locationKey, minVersion, maxVersion, name, 
                  updateURL, updateHash, iconURL, updateRDF, type) {
  var item = Components.classes["@mozilla.org/updates/item;1"]
                       .createInstance(Components.interfaces.nsIUpdateItem);
  item.init(id, version, locationKey, minVersion, maxVersion, name,
            updateURL, updateHash, iconURL, updateRDF, type);
  return item;
}

/**
 * Gets the specified directory at the speciifed hierarchy under a 
 * Directory Service key. 
 * @param   key
 *          The Directory Service Key to start from
 * @param   pathArray
 *          An array of path components to locate beneath the directory 
 *          specified by |key|
 * @return  nsIFile object for the location specified. If the directory
 *          requested does not exist, it is created, along with any
 *          parent directories that need to be created.
 */
function getDir(key, pathArray) {
  return getDirInternal(key, pathArray, true);
}

/**
 * Gets the specified directory at the speciifed hierarchy under a 
 * Directory Service key. 
 * @param   key
 *          The Directory Service Key to start from
 * @param   pathArray
 *          An array of path components to locate beneath the directory 
 *          specified by |key|
 * @return  nsIFile object for the location specified. If the directory
 *          requested does not exist, it is NOT created.
 */
function getDirNoCreate(key, pathArray) {
  return getDirInternal(key, pathArray, false);
}

/**
 * Gets the specified directory at the speciifed hierarchy under a 
 * Directory Service key. 
 * @param   key
 *          The Directory Service Key to start from
 * @param   pathArray
 *          An array of path components to locate beneath the directory 
 *          specified by |key|
 * @param   shouldCreate
 *          true if the directory hierarchy specified in |pathArray|
 *          should be created if it does not exist,
 *          false otherwise.
 * @return  nsIFile object for the location specified. 
 */
function getDirInternal(key, pathArray, shouldCreate) {
  var fileLocator = Components.classes["@mozilla.org/file/directory_service;1"]
                              .getService(Components.interfaces.nsIProperties);
  var dir = fileLocator.get(key, nsILocalFile);
  for (var i = 0; i < pathArray.length; ++i) {
    dir.append(pathArray[i]);
    if (shouldCreate && !dir.exists())
      dir.create(nsILocalFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
  }
  dir.followLinks = false;
  return dir;
}

/**
 * Gets the file at the speciifed hierarchy under a Directory Service key.
 * @param   key
 *          The Directory Service Key to start from
 * @param   pathArray
 *          An array of path components to locate beneath the directory 
 *          specified by |key|. The last item in this array must be the
 *          leaf name of a file.
 * @return  nsIFile object for the file specified. The file is NOT created
 *          if it does not exist, however all required directories along 
 *          the way are.
 */
function getFile(key, pathArray) {
  var file = getDir(key, pathArray.slice(0, -1));
  file.append(pathArray[pathArray.length - 1]);
  return file;
}

/**
 * Gets the descriptor of a directory as a relative path to common base
 * directories (profile, user home, app install dir, etc).
 *
 * @param   itemLocation
 *          The nsILocalFile representing the item's directory.
 * @param   installLocation the nsIInstallLocation for this item
 */
function getDescriptorFromFile(itemLocation, installLocation) {
  var baseDir = installLocation.location;

  if (baseDir && baseDir.contains(itemLocation, true)) {
    return "rel%" + itemLocation.getRelativeDescriptor(baseDir);
  }

  return "abs%" + itemLocation.persistentDescriptor;
}

function getAbsoluteDescriptor(itemLocation) {
  return itemLocation.persistentDescriptor;
}

/**
 * Initializes a Local File object based on a descriptor
 * provided by "getDescriptorFromFile".
 *
 * @param   descriptor
 *          The descriptor that locates the directory
 * @param   installLocation
 *          The nsIInstallLocation object for this item.
 * @returns The nsILocalFile object representing the location of the item
 */
function getFileFromDescriptor(descriptor, installLocation) {
  var location = Components.classes["@mozilla.org/file/local;1"]
                           .createInstance(nsILocalFile);

  var m = descriptor.match(/^(abs|rel)\%(.*)$/);
  if (!m)
    throw Components.results.NS_ERROR_INVALID_ARG;

  if (m[1] == "rel") {
    location.setRelativeDescriptor(installLocation.location, m[2]);
  }
  else {
    location.persistentDescriptor = m[2];
  }

  return location;
}

/**
 * Determines if a file is an item package - either a XPI or a JAR file.
 * @param   file
 *          The file to check
 * @returns true if the file is an item package, false otherwise.
 */
function fileIsItemPackage(file) {
  var fileURL = getURIFromFile(file);
  if (fileURL instanceof nsIURL)
    var extension = fileURL.fileExtension.toLowerCase();
  return extension == "xpi" || extension == "jar";
}

/** 
 * Return the leaf name used by the extension system for staging an item.
 * @param   id
 *          The GUID of the item
 * @param   type
 *          The nsIUpdateItem type of the item
 * @returns The leaf name of the staged file.
 */
function getStagedLeafName(id, type) {
  if (type == nsIUpdateItem.TYPE_THEME) 
    return id + ".jar";
  return id + ".xpi";
}

/**
 * Opens a safe file output stream for writing. 
 * @param   file
 *          The file to write to.
 * @param   modeFlags
 *          (optional) File open flags. Can be undefined. 
 * @returns nsIFileOutputStream to write to.
 */
function openSafeFileOutputStream(file, modeFlags) {
  var fos = Components.classes["@mozilla.org/network/safe-file-output-stream;1"]
                      .createInstance(Components.interfaces.nsIFileOutputStream);
  if (modeFlags === undefined)
    modeFlags = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE;
  if (!file.exists()) 
    file.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
  fos.init(file, modeFlags, PERMS_FILE, 0);
  return fos;
}

/**
 * Closes a safe file output stream.
 * @param   stream
 *          The stream to close.
 */
function closeSafeFileOutputStream(stream) {
  if (stream instanceof Components.interfaces.nsISafeOutputStream)
    stream.finish();
  else
    stream.close();
}

/**
 * Deletes a directory and its children. First it tries nsIFile::Remove(true).
 * If that fails it will fall back to recursing, setting the appropriate
 * permissions, and deleting the current entry. This is needed for when we have
 * rights to delete a directory but there are entries that have a read-only
 * attribute (e.g. a copy restore from a read-only CD, etc.)
 * @param   dir
 *          A nsIFile for the directory to be deleted
 */
function removeDirRecursive(dir) {
  try {
    dir.remove(true);
    return;
  }
  catch (e) {
  }

  var dirEntries = dir.directoryEntries;
  while (dirEntries.hasMoreElements()) {
    var entry = dirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);

    if (entry.isDirectory()) {
      removeDirRecursive(entry);
    }
    else {
      entry.permissions = PERMS_FILE;
      entry.remove(false);
    }
  }
  dir.permissions = PERMS_DIRECTORY;
  dir.remove(true);
}

/**
 * Logs a string to the error console. 
 * @param   string
 *          The string to write to the error console..
 */  
function LOG(string) {
  if (gLoggingEnabled) {
    dump("*** " + string + "\n");
    gConsole.logStringMessage(string);
  }
}

/** 
 * Randomize the specified file name. Used to force RDF to bypass the cache
 * when loading certain types of files.
 * @param   fileName 
 *          A file name to randomize, e.g. install.rdf
 * @returns A randomized file name, e.g. install-xyz.rdf
 */
function getRandomFileName(fileName) {
  var extensionDelimiter = fileName.lastIndexOf(".");
  var prefix = fileName.substr(0, extensionDelimiter);
  var suffix = fileName.substr(extensionDelimiter);
  
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  var nameString = prefix + "-";
  for (var i = 0; i < 3; ++i) {
    var index = Math.round((Math.random()) * characters.length);
    nameString += characters.charAt(index);
  }
  return nameString + "." + suffix;
}

/**
 * Get the RDF URI prefix of a nsIUpdateItem type. This function should be used
 * ONLY to support Firefox 1.0 Update RDF files! Item URIs in the datasource 
 * are NOT prefixed.
 * @param   type
 *          The nsIUpdateItem type to find a RDF URI prefix for
 * @returns The RDF URI prefix.
 */
function getItemPrefix(type) {
  if (type & nsIUpdateItem.TYPE_EXTENSION) 
    return PREFIX_EXTENSION;
  else if (type & nsIUpdateItem.TYPE_THEME)
    return PREFIX_THEME;
  return PREFIX_ITEM_URI;
}

/**
 * Trims a prefix from a string.
 * @param   string
 *          The source string
 * @param   prefix
 *          The prefix to remove.
 * @returns The suffix (string - prefix)
 */
function stripPrefix(string, prefix) {
  return string.substr(prefix.length);
}

/**
 * Gets a File URL spec for a nsIFile
 * @param   file
 *          The file to get a file URL spec to
 * @returns The file URL spec to the file
 */
function getURLSpecFromFile(file) {
  var ioServ = Components.classes["@mozilla.org/network/io-service;1"]
                         .getService(Components.interfaces.nsIIOService);
  var fph = ioServ.getProtocolHandler("file")
                  .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
  return fph.getURLSpecFromFile(file);
}

/**
 * Constructs a URI to a spec.
 * @param   spec
 *          The spec to construct a URI to
 * @returns The nsIURI constructed.
 */
function newURI(spec) {
  var ioServ = Components.classes["@mozilla.org/network/io-service;1"]
                         .getService(Components.interfaces.nsIIOService);
  return ioServ.newURI(spec, null, null);
}

/** 
 * Constructs a File URI to a nsIFile
 * @param   file
 *          The file to construct a File URI to
 * @returns The file URI to the file
 */
function getURIFromFile(file) {
  var ioServ = Components.classes["@mozilla.org/network/io-service;1"]
                         .getService(Components.interfaces.nsIIOService);
  return ioServ.newFileURI(file);
}

/**
 * @returns Whether or not we are currently running in safe mode.
 */
function inSafeMode() {
  return gApp.inSafeMode;
}

/**
 * Extract the string value from a RDF Literal or Resource
 * @param   literalOrResource
 *          RDF String Literal or Resource
 * @returns String value of the literal or resource, or undefined if the object
 *          supplied is not a RDF string literal or resource.
 */
function stringData(literalOrResource) {
  if (literalOrResource instanceof Components.interfaces.nsIRDFLiteral)
    return literalOrResource.Value;
  if (literalOrResource instanceof Components.interfaces.nsIRDFResource)
    return literalOrResource.Value;
  return undefined;
}

/**
 * Extract the integer value of a RDF Literal
 * @param   literal
 *          nsIRDFInt literal
 * @return  integer value of the literal
 */
function intData(literal) {
  if (literal instanceof Components.interfaces.nsIRDFInt)
    return literal.Value;
  return undefined;
}

/**
 * Gets a property from an install manifest.
 * @param   installManifest
 *          An Install Manifest datasource to read from
 * @param   property
 *          The name of a proprety to read (sans EM_NS)
 * @returns The literal value of the property, or undefined if the property has
 *          no value.
 */
function getManifestProperty(installManifest, property) {
  var target = installManifest.GetTarget(gInstallManifestRoot, 
                                         gRDF.GetResource(EM_NS(property)), true);
  var val = stringData(target);
  return val === undefined ? intData(target) : val;
}

/**
 * Given an Install Manifest Datasource, retrieves the type of item the manifest
 * describes.
 * @param   installManifest 
 *          The Install Manifest Datasource.
 * @return  The nsIUpdateItem type of the item described by the manifest
 *          returns TYPE_EXTENSION if attempts to determine the type fail.
 */
function getAddonTypeFromInstallManifest(installManifest) {
  var target = installManifest.GetTarget(gInstallManifestRoot, 
                                         gRDF.GetResource(EM_NS("type")), true);
  if (target) {
    var type = stringData(target);
    return type === undefined ? intData(target) : parseInt(type);
  }

  // Firefox 1.0 and earlier did not support addon-type annotation on the 
  // Install Manifest, so we fall back to a theme-only property to 
  // differentiate.
  if (getManifestProperty(installManifest, "internalName") !== undefined)
    return nsIUpdateItem.TYPE_THEME;

  // If no type is provided, default to "Extension"
  return nsIUpdateItem.TYPE_EXTENSION;    
}

/**
 * Shows a message about an incompatible Extension/Theme. 
 * @param   installData
 *          An Install Data object from |getInstallData|
 */
function showIncompatibleError(installData) {
  var extensionStrings = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
  var params = [extensionStrings.GetStringFromName("type-" + installData.type)];
  var title = extensionStrings.formatStringFromName("incompatibleTitle", 
                                                    params, params.length);
  var message;
  var targetAppData = installData.currentApp;
  if (!targetAppData) {
    params = [installData.name, installData.version, BundleManager.appName];
    message = extensionStrings.formatStringFromName("incompatibleMessageNoApp", 
                                                    params, params.length);
  }
  else if (targetAppData.minVersion == targetAppData.maxVersion) {
    // If the min target app version and the max target app version are the same, don't show
    // a message like, "Foo is only compatible with Firefox versions 0.7 to 0.7", rather just
    // show, "Foo is only compatible with Firefox 0.7"
    params = [installData.name, installData.version, BundleManager.appName, gApp.version, 
              installData.name, installData.version, BundleManager.appName, 
              targetAppData.minVersion];
    message = extensionStrings.formatStringFromName("incompatibleMsgSingleAppVersion", 
                                                    params, params.length);
  }
  else {
    params = [installData.name, installData.version, BundleManager.appName, gApp.version, 
              installData.name, installData.version, BundleManager.appName, 
              targetAppData.minVersion, targetAppData.maxVersion];
    message = extensionStrings.formatStringFromName("incompatibleMsg", params, params.length);
  }
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

/**
 * Shows a message.
 * @param   titleKey
 *          String key of the title string in the Extensions localization file.
 * @param   messageKey
 *          String key of the message string in the Extensions localization file.
 * @param   messageParams
 *          Array of strings to be substituted into |messageKey|. Can be null.
 */
function showMessage(titleKey, titleParams, messageKey, messageParams) {
  var extensionStrings = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
  if (titleParams && titleParams.length > 0) {
    var title = extensionStrings.formatStringFromName(titleKey, titleParams,
                                                      titleParams.length);
  }
  else
    title = extensionStrings.GetStringFromName(titleKey);

  if (messageParams && messageParams.length > 0) {
    var message = extensionStrings.formatStringFromName(messageKey, messageParams,
                                                        messageParams.length);
  }
  else
    message = extensionStrings.GetStringFromName(messageKey);
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

/**
 * Shows a dialog for blocklisted items.
 * @param   items
 *          An array of nsIUpdateItems.
 * @param   fromInstall
 *          Whether this is called from an install or from the blocklist
 *          background check.
 */
function showBlocklistMessage(items, fromInstall) {
  var win = null;
  var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                         .createInstance(Components.interfaces.nsIDialogParamBlock);
  params.SetInt(0, (fromInstall ? 1 : 0));
  params.SetInt(1, items.length);
  params.SetNumberStrings(items.length * 2);
  for (var i = 0; i < items.length; ++i) 
    params.SetString(i, items[i].name + " " + items[i].version);

  // if this was initiated from an install try to find the appropriate manager
  if (fromInstall) {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    win = wm.getMostRecentWindow(nsIUpdateItem.TYPE_THEME ? "Extension:Manager-themes" :
                                                            "Extension:Manager-extensions");
  }
  var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                     .getService(Components.interfaces.nsIWindowWatcher);
  ww.openWindow(win, URI_EXTENSION_LIST_DIALOG, "",
                "chrome,centerscreen,modal,dialog,titlebar", params);
}

/** 
 * Gets a zip reader for the file specified.
 * @param   zipFile
 *          A ZIP archive to open with a nsIZipReader.
 * @return  A nsIZipReader for the file specified.
 */
function getZipReaderForFile(zipFile) {
  try {
    var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                              .createInstance(Components.interfaces.nsIZipReader);
    zipReader.init(zipFile);
    zipReader.open();
  }
  catch (e) {
    zipReader.close();
    throw e;
  }
  return zipReader;
}

/** 
 * Extract a RDF file from a ZIP archive to a random location in the system
 * temp directory.
 * @param   zipFile
 *          A ZIP archive to read from
 * @param   fileName 
 *          The name of the file to read from the zip. 
 * @param   suppressErrors
 *          Whether or not to report errors. 
 * @return  The file created in the temp directory.
 */
function extractRDFFileToTempDir(zipFile, fileName, suppressErrors) {
  var file = getFile(KEY_TEMPDIR, [getRandomFileName(fileName)]);
  try {
    var zipReader = getZipReaderForFile(zipFile);
    zipReader.getEntry(fileName);
    zipReader.extract(fileName, file);
    zipReader.close();
  }
  catch (e) {
    if (!suppressErrors) {
      showMessage("missingFileTitle", [], "missingFileMessage", 
                  [BundleManager.appName, fileName]);
      throw e;
    }
  }
  return file;
}

/**
 * Show a message to the user informing them they are installing an old non-EM
 * style Theme, and that these are not supported.
 * @param   installManifest 
 *          The Old-Style Contents Manifest datasource representing the theme. 
 */
function showOldThemeError(contentsManifest) {
  var extensionStrings = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
  var params = [extensionStrings.GetStringFromName("theme")];
  var title = extensionStrings.formatStringFromName("incompatibleTitle", 
                                                    params, params.length);
  var appVersion = extensionStrings.GetStringFromName("incompatibleOlder");
  
  try {  
    var ctr = getContainer(contentsManifest, 
                           gRDF.GetResource("urn:mozilla:skin:root"));
    var elts = ctr.GetElements();
    var nameArc = gRDF.GetResource(CHROME_NS("displayName"));
    while (elts.hasMoreElements()) {
      var elt = elts.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      themeName = stringData(contentsManifest.GetTarget(elt, nameArc, true));
      if (themeName) 
        break;
    }
  }
  catch (e) {
    themeName = extensionStrings.GetStringFromName("incompatibleThemeName");
  }
  
  params = [themeName, "", BundleManager.appName, gApp.version, themeName, "", 
            BundleManager.appName, appVersion];
  var message = extensionStrings.formatStringFromName("incompatibleMsgSingleAppVersion",
                                                      params, params.length);
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

/**
 * Gets an Install Manifest datasource from a file.
 * @param   file
 *          The nsIFile that contains the Install Manifest RDF
 * @returns The Install Manifest datasource
 */
function getInstallManifest(file) {
  var fileURL = getURLSpecFromFile(file);
  var ds = gRDF.GetDataSourceBlocking(fileURL);
  var arcs = ds.ArcLabelsOut(gInstallManifestRoot);
  if (!arcs.hasMoreElements()) {
    ds = null;
    var uri = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService)
                        .newFileURI(file);
    var url = uri.QueryInterface(nsIURL);
    showMessage("malformedTitle", [], "malformedMessage", 
                [BundleManager.appName, url.fileName]);
  }
  return ds;
}

/**
 * An enumeration of items in a JS array.
 * @constructor
 */
function ArrayEnumerator(aItems) {
  this._index = 0;
  if (aItems) {
    for (var i = 0; i < aItems.length; ++i) {
      if (!aItems[i])
        aItems.splice(i, 1);      
    }
  }
  this._contents = aItems;
}

ArrayEnumerator.prototype = {
  _index: 0,
  _contents: [],
  
  hasMoreElements: function() {
    return this._index < this._contents.length;
  },
  
  getNext: function() {
    return this._contents[this._index++];      
  }
};

/**
 * An enumeration of files in a JS array.
 * @param   files
 *          The files to enumerate
 * @constructor
 */
function FileEnumerator(files) {
  this._index = 0;
  if (files) {
    for (var i = 0; i < files.length; ++i) {
      if (!files[i])
        files.splice(i, 1);      
    }
  }
  this._contents = files;
}

FileEnumerator.prototype = {
  _index: 0,
  _contents: [],

  /**
   * Gets the next file in the sequence.
   */  
  get nextFile() {
    if (this._index < this._contents.length)
      return this._contents[this._index++];
    return null;
  },
  
  /**
   * Stop enumerating. Nothing to do here.
   */
  close: function() {
  },
};

/**
 * An object which identifies an Install Location for items, where the location
 * relationship is each item living in a directory named with its GUID under 
 * the directory used when constructing this object.
 *
 * e.g. <location>\{GUID1}
 *      <location>\{GUID2}
 *      <location>\{GUID3}
 *      ...
 *
 * @param   name
 *          The string identifier of this Install Location.
 * @param   location
 *          The directory that contains the items. 
 * @constructor
 */
function DirectoryInstallLocation(name, location, restricted, priority) {
  this._name = name;
  if (location.exists()) {
    if (!location.isDirectory())
      throw new Error("location must be a directoy!");
  }
  else {
    try {
      location.create(nsILocalFile.DIRECTORY_TYPE, 0775);
    }
    catch (e) {
      LOG("DirectoryInstallLocation: failed to create location " + 
          " directory = " + location.path + ", exception = " + e + "\n");
    }
  }

  this._location = location;
  this._locationToIDMap = {};
  this._restricted = restricted;
  this._priority = priority;
}
DirectoryInstallLocation.prototype = {
  _name           : "",
  _location       : null,
  _locationToIDMap: null,
  _restricted     : false,
  _priority       : 0,
  _canAccess      : null,
  
  /**
   * See nsIExtensionManager.idl
   */
  get name() {
    return this._name;
  },
  
  /**
   * Reads a directory linked to in a file.
   * @param   file
   *          The file containing the directory path
   * @returns A nsILocalFile object representing the linked directory.
   */
  _readDirectoryFromFile: function(file) {
    var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Components.interfaces.nsIFileInputStream);
    fis.init(file, -1, -1, false);
    var line = { value: "" };
    if (fis instanceof nsILineInputStream)
      fis.readLine(line);
    fis.close();
    if (line.value) {
      var linkedDirectory = Components.classes["@mozilla.org/file/local;1"]
                                      .createInstance(nsILocalFile);
      try {
        linkedDirectory.initWithPath(line.value);
      }
      catch (e) {
        linkedDirectory.setRelativeDescriptor(file.parent, line.value);
      }
      
      return linkedDirectory;
    }
    return null;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  get itemLocations() {
    var locations = [];
    if (!this._location.exists())
      return new FileEnumerator(locations);
    
    try {
      var entries = this._location.directoryEntries.QueryInterface(nsIDirectoryEnumerator);
      while (true) {
        var entry = entries.nextFile;
        if (!entry)
          break;
        entry instanceof nsILocalFile;
        if (!entry.isDirectory() && gIDTest.test(entry.leafName)) {
          var linkedDirectory = this._readDirectoryFromFile(entry);
          if (linkedDirectory && linkedDirectory.exists() && 
              linkedDirectory.isDirectory()) {
            locations.push(linkedDirectory);
            this._locationToIDMap[linkedDirectory.persistentDescriptor] = entry.leafName;
          }
        }
        else
          locations.push(entry);
      }
      entries.close();
    }
    catch (e) { 
    }
    return new FileEnumerator(locations);
  },
  
  /**
   * Retrieves the GUID for an item at the specified location.
   * @param   file
   *          The location where an item might live.
   * @returns The ID for an item that might live at the location specified.
   * 
   * N.B. This function makes no promises about whether or not this path is 
   *      actually maintained by this Install Location.
   */
  getIDForLocation: function(file) {
    var section = file.leafName;
    var filePD = file.persistentDescriptor;
    if (filePD in this._locationToIDMap) 
      section = this._locationToIDMap[filePD];
    
    if (gIDTest.test(section))
      return RegExp.$1;
    return undefined;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  get location() {
    return this._location.clone();
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  get restricted() {
    return this._restricted;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  get canAccess() {
    if (this._canAccess != null)
      return this._canAccess;

    var testFile = this.location;
    testFile.append("Access Privileges Test");
    try {
      testFile.createUnique(nsILocalFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
      testFile.remove(false);
      this._canAccess = true;
    }
    catch (e) {
      this._canAccess = false;
    }
    return this._canAccess;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  get priority() {
    return this._priority;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  getItemLocation: function(id) {
    var itemLocation = this.location;
    itemLocation.append(id);
    if (itemLocation.exists() && !itemLocation.isDirectory())
      return this._readDirectoryFromFile(itemLocation);
    if (!itemLocation.exists() && this.canAccess)
      itemLocation.create(nsILocalFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
    return itemLocation;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  itemIsManagedIndependently: function(id) {
    var itemLocation = this.location;
    itemLocation.append(id);
    return itemLocation.exists() && !itemLocation.isDirectory();      
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  getItemFile: function(id, filePath) {
    var itemLocation = this.getItemLocation(id).clone();
    var parts = filePath.split("/");
    for (var i = 0; i < parts.length; ++i)
      itemLocation.append(parts[i]);
    return itemLocation;
  },

  /**
   * Stages the specified file for later.
   * @param   file
   *          The file to stage
   * @param   id
   *          The GUID of the item the file represents
   */
  stageFile: function(file, id) {
    var stagedFile = this.location;
    stagedFile.append(DIR_STAGE);
    stagedFile.append(id);
    stagedFile.append(file.leafName);

    // When an incompatible update is successful the file is already staged
    if (stagedFile.equals(file))
      return stagedFile;

    if (stagedFile.exists()) 
      stagedFile.remove(false);
      
    file.copyTo(stagedFile.parent, stagedFile.leafName);
    
    // If the file has incorrect permissions set, correct them now.
    if (!stagedFile.isWritable())
      stagedFile.permissions = PERMS_FILE;
    
    return stagedFile;
  },
  
  /**
   * Returns the most recently staged package (e.g. the last XPI or JAR in a
   * directory) for an item and removes items that do not qualify.
   * @param   id
   *          The ID of the staged package
   * @returns an nsIFile if the package exists otherwise null.
   */
  getStageFile: function(id) {
    var stageFile = null;
    var stageDir = this.location;
    stageDir.append(DIR_STAGE);
    stageDir.append(id);
    if (!stageDir.exists() || !stageDir.isDirectory())
      return null;
    try {
      var entries = stageDir.directoryEntries.QueryInterface(nsIDirectoryEnumerator);
      while (entries.hasMoreElements()) {
        var file = entries.nextFile;
        if (!(file instanceof nsILocalFile))
          continue;
        if (file.isDirectory())
          removeDirRecursive(file);
        else if (fileIsItemPackage(file)) {
          if (stageFile)
            stageFile.remove(false);
          stageFile = file;
        }
        else
          file.remove(false);
      }
    }
    catch (e) {
    }
    if (entries instanceof nsIDirectoryEnumerator)
      entries.close();
    return stageFile;
  },
  
  /**
   * Removes a file from the stage. This cleans up the stage if there is nothing
   * else left after the remove operation.
   * @param   file
   *          The file to remove.
   */
  removeFile: function(file) {
    if (file.exists())
      file.remove(false);
    var parent = file.parent;
    var entries = parent.directoryEntries;    
    try {
      // XXXrstrong calling hasMoreElements on a nsIDirectoryEnumerator after
      // it has been removed will cause a crash on Mac OS X - bug 292823
      while (parent && !parent.equals(this.location) &&
            !entries.hasMoreElements()) {
        parent.remove(false);
        parent = parent.parent;
        entries = parent.directoryEntries;
      }
      if (entries instanceof nsIDirectoryEnumerator)
        entries.close();
    }
    catch (e) {
      LOG("DirectoryInstallLocation::removeFile: failed to remove staged " + 
          " directory = " + parent.path + ", exception = " + e + "\n");
    }
  },
  
  /**
   * See nsISupports.idl
   */
  QueryInterface: function (iid) {
    if (!iid.equals(Components.interfaces.nsIInstallLocation) &&
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

//@line 1446 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"

/**
 * An object which handles the installation of an Extension.
 * @constructor
 */
function Installer(ds, id, installLocation, type) {
  this._ds = ds;
  this._id = id;
  this._type = type;
  this._installLocation = installLocation;
}
Installer.prototype = {
  // Item metadata
  _id: null,
  _ds: null,
  _installLocation: null,
  _metadataDS: null,
  
  /**
   * Gets the Install Manifest datasource we are installing from.
   */
  get metadataDS() {
    if (!this._metadataDS) {
      var metadataFile = this._installLocation
                             .getItemFile(this._id, FILE_INSTALL_MANIFEST);
      if (!metadataFile.exists()) 
        return null;
      this._metadataDS = getInstallManifest(metadataFile);
      if (!this._metadataDS) {
        LOG("Installer::install: metadata datasource for extension " + 
            this._id + " at " + metadataFile.path + " could not be loaded. " + 
            " Installation will not proceed.");
      }
    }
    return this._metadataDS;
  },
  
  /**
   * Installs the Extension
   * @param   file
   *          A XPI/JAR file to install from. If this is null or does not exist,
   *          the item is assumed to be an expanded directory, located at the GUID
   *          key in the supplied Install Location.
   */
  installFromFile: function(file) {
    // Move files from the staging dir into the extension's final home.
    if (file && file.exists()) {
      this._installExtensionFiles(file);
    }

    if (!this.metadataDS)
      return;

    // Upgrade old-style contents.rdf Chrome Manifests if necessary.
    if (this._type == nsIUpdateItem.TYPE_THEME)
      this.upgradeThemeChrome();
    else
      this.upgradeExtensionChrome();

    // Add metadata for the extension to the global extension metadata set
    this._ds.addItemMetadata(this._id, this.metadataDS, this._installLocation);
  },
  
  /**
   * Safely extract the Extension's files into the target folder.
   * @param   file
   *          The XPI/JAR file to install from.
   */
  _installExtensionFiles: function(file) {
    var installer = this;
    /**
      * Callback for |safeInstallOperation| that performs file level installation
      * steps for an Extension.
      * @param   extensionID
      *          The GUID of the Extension being installed.
      * @param   installLocation 
      *          The Install Location where the Extension is being installed.
      * @param   xpiFile
      *          The source XPI file that contains the Extension.
      */
    function extractExtensionFiles(extensionID, installLocation, xpiFile) {
      // Create a logger to log install operations for uninstall. This must be 
      // created in the |safeInstallOperation| callback, since it creates a file
      // in the target directory. If we do this outside of the callback, we may
      // be clobbering a file we should not be.
      var zipReader = getZipReaderForFile(xpiFile);
      
      // create directories first
      var entries = zipReader.findEntries("*/");
      while (entries.hasMoreElements()) {
        var entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
        var target = installLocation.getItemFile(extensionID, entry.name);
        if (!target.exists()) {
          try {
            target.create(nsILocalFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
          }
          catch (e) {
            LOG("extractExtensionsFiles: failed to create target directory for extraction " + 
                " file = " + target.path + ", exception = " + e + "\n");
          }
        }
      }

      entries = zipReader.findEntries("*");
      while (entries.hasMoreElements()) {
        entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
        target = installLocation.getItemFile(extensionID, entry.name);
        if (target.exists())
          continue;

        try {
          target.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
        }
        catch (e) {
          LOG("extractExtensionsFiles: failed to create target file for extraction " + 
              " file = " + target.path + ", exception = " + e + "\n");
        }
        zipReader.extract(entry.name, target);
      }
      zipReader.close();
    }

    var installer = this;
    /**
      * Callback for |safeInstallOperation| that performs file level installation
      * steps for a Theme.
      * @param   id
      *          The GUID of the Theme being installed.
      * @param   installLocation 
      *          The Install Location where the Theme is being installed.
      * @param   jarFile
      *          The source JAR file that contains the Theme.
      */
    function extractThemeFiles(id, installLocation, jarFile) {
      var themeDirectory = installLocation.getItemLocation(id);
      var zipReader = getZipReaderForFile(jarFile);

      // The only critical file is the install.rdf and we would not have
      // gotten this far without one.
      var rootFiles = [FILE_INSTALL_MANIFEST, FILE_CHROME_MANIFEST,
                       "preview.png", "icon.png"];
      for (var i = 0; i < rootFiles.length; ++i) {
        try {
          var entry = zipReader.getEntry(rootFiles[i]);
          var target = installLocation.getItemFile(id, rootFiles[i]);
          zipReader.extract(rootFiles[i], target);
        }
        catch (e) {
        }
      }

      var manifestFile = installLocation.getItemFile(id, FILE_CHROME_MANIFEST);
      // new theme structure requires a chrome.manifest file
      if (manifestFile.exists()) {
        var entries = zipReader.findEntries(DIR_CHROME + "/*");
        while (entries.hasMoreElements()) {
          entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
          if (entry.name.substr(entry.name.length - 1, 1) == "/")
            continue;
          target = installLocation.getItemFile(id, entry.name);
          try {
            target.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
          }
          catch (e) {
            LOG("extractThemeFiles: failed to create target file for extraction " + 
                " file = " + target.path + ", exception = " + e + "\n");
          }
          zipReader.extract(entry.name, target);
        }
        zipReader.close();
      }
      else { // old theme structure requires only an install.rdf
        try {
          var entry = zipReader.getEntry(FILE_CONTENTS_MANIFEST);
          var contentsManifestFile = installLocation.getItemFile(id, FILE_CONTENTS_MANIFEST);
          contentsManifestFile.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
          zipReader.extract(FILE_CONTENTS_MANIFEST, contentsManifestFile);
        }
        catch (e) {
          zipReader.close();
          LOG("extractThemeFiles: failed to extract contents.rdf: " + target.path);
          throw e; // let the safe-op clean up
        }
        zipReader.close();
        var chromeDir = installLocation.getItemFile(id, DIR_CHROME);
        try {
          jarFile.copyTo(chromeDir, jarFile.leafName);
        }
        catch (e) {
          LOG("extractThemeFiles: failed to copy theme JAR file to: " + chromeDir.path);
          throw e; // let the safe-op clean up
        }

        if (!installer.metadataDS && installer._type == nsIUpdateItem.TYPE_THEME) {
          if (contentsManifestFile && contentsManifestFile.exists()) {
            var contentsManifest = gRDF.GetDataSourceBlocking(getURLSpecFromFile(contentsManifestFile));
            showOldThemeError(contentsManifest);
          }
          LOG("Theme JAR file: " + jarFile.leafName + " contains an Old-Style " + 
              "Theme that is not compatible with this version of the software.");
          throw new Error("Old Theme"); // let the safe-op clean up
        }
      }
    }

    var callback = extractExtensionFiles;
    if (this._type == nsIUpdateItem.TYPE_THEME)
      callback = extractThemeFiles;
    safeInstallOperation(this._id, this._installLocation,
                          { callback: callback, data: file });
  },
  
  /** 
   * Upgrade contents.rdf Chrome Manifests used by this Theme to the new 
   * chrome.manifest format if necessary.
   */
  upgradeThemeChrome: function() {
    // Use the Chrome Registry API to install the theme there
    var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                       .getService(Components.interfaces.nsIToolkitChromeRegistry);
    var manifestFile = this._installLocation.getItemFile(this._id, FILE_CHROME_MANIFEST);
    if (manifestFile.exists() ||
        this._id == stripPrefix(RDFURI_DEFAULT_THEME, PREFIX_ITEM_URI))
      return;

    try {
      // creates a chrome manifest for themes
      var manifestURI = getURIFromFile(manifestFile);
      var chromeDir = this._installLocation.getItemFile(this._id, DIR_CHROME);
      // We're relying on the fact that there is only one JAR file
      // in the "chrome" directory. This is a hack, but it works.
      var entries = chromeDir.directoryEntries.QueryInterface(nsIDirectoryEnumerator);
      var jarFile = entries.nextFile;
      if (jarFile) {
        var jarFileURI = getURIFromFile(jarFile);
        var contentsURI = newURI("jar:" + jarFileURI.spec + "!/");
        var contentsFile = this._installLocation.getItemFile(this._id, FILE_CONTENTS_MANIFEST);
        var contentsFileURI = getURIFromFile(contentsFile.parent);

        cr.processContentsManifest(contentsFileURI, manifestURI, contentsURI, false, true);
      }
      entries.close();
      contentsFile.remove(false);
    }
    catch (e) {
      // Failed to register chrome, for any number of reasons - non-existent 
      // contents.rdf file at the location specified, malformed contents.rdf, 
      // etc. Set the pending op to be OP_NEEDS_UNINSTALL so that the 
      // extension is uninstalled properly during the subsequent uninstall 
      // pass in |ExtensionManager::_finalizeOperations|
      LOG("upgradeThemeChrome: failed for theme " + this._id + " - why " + 
          "not convert to the new chrome.manifest format while you're at it? " + 
          "Failure exception: " + e);
      showMessage("malformedRegistrationTitle", [], "malformedRegistrationMessage",
                  [BundleManager.appName]);

      var stageFile = this._installLocation.getStageFile(this._id);
      if (stageFile)
        this._installLocation.removeFile(stageFile);

      StartupCache.put(this._installLocation, this._id, OP_NEEDS_UNINSTALL, true);
      StartupCache.write();
    }
  },

  /** 
   * Upgrade contents.rdf Chrome Manifests used by this Extension to the new 
   * chrome.manifest format if necessary.
   */
  upgradeExtensionChrome: function() {
    // If the extension is aware of the new flat chrome manifests and has 
    // included one, just use it instead of generating one from the
    // install.rdf/contents.rdf data.
    var manifestFile = this._installLocation.getItemFile(this._id, FILE_CHROME_MANIFEST);
    if (manifestFile.exists())
      return;

    try {
      // Enumerate the metadata datasource files collection and register chrome
      // for each file, calling _registerChrome for each.
      var chromeDir = this._installLocation.getItemFile(this._id, DIR_CHROME);
      
      if (!manifestFile.parent.exists())
        return;

      // Even if an extension doesn't have any chrome, we generate an empty
      // manifest file so that we don't try to upgrade from the "old-style"
      // chrome manifests at every startup.
      manifestFile.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);

      var manifestURI = getURIFromFile(manifestFile);
      var files = this.metadataDS.GetTargets(gInstallManifestRoot, EM_R("file"), true);
      while (files.hasMoreElements()) {
        var file = files.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var chromeFile = chromeDir.clone();
        var fileName = file.Value.substr("urn:mozilla:extension:file:".length, file.Value.length);
        chromeFile.append(fileName);

        var fileURLSpec = getURLSpecFromFile(chromeFile);
        if (!chromeFile.isDirectory()) {
          var zipReader = getZipReaderForFile(chromeFile);
          fileURLSpec = "jar:" + fileURLSpec + "!/";
          var contentsFile = this._installLocation.getItemFile(this._id, FILE_CONTENTS_MANIFEST);
          contentsFile.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
        }

        var providers = [EM_R("package"), EM_R("skin"), EM_R("locale")];
        for (var i = 0; i < providers.length; ++i) {
          var items = this.metadataDS.GetTargets(file, providers[i], true);
          while (items.hasMoreElements()) {
            var item = items.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral);
            var fileURI = newURI(fileURLSpec + item.Value);
            // Extract the contents.rdf files instead of opening them inside of
            // the jar. This prevents the jar from being cached by the zip
            // reader which will keep the jar in use and prevent deletion.
            if (zipReader) {
              zipReader.extract(item.Value + FILE_CONTENTS_MANIFEST, contentsFile);
              var contentsFileURI = getURIFromFile(contentsFile.parent);
            }
            else
              contentsFileURI = fileURI;

            var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                               .getService(Components.interfaces.nsIToolkitChromeRegistry);
            cr.processContentsManifest(contentsFileURI, manifestURI, fileURI, true, false);
          }
        }
        if (zipReader) {
          zipReader.close();
          zipReader = null;
          contentsFile.remove(false);
        }
      }
    }
    catch (e) {
      // Failed to register chrome, for any number of reasons - non-existent 
      // contents.rdf file at the location specified, malformed contents.rdf, 
      // etc. Set the pending op to be OP_NEEDS_UNINSTALL so that the 
      // extension is uninstalled properly during the subsequent uninstall 
      // pass in |ExtensionManager::_finalizeOperations|
      LOG("upgradeExtensionChrome: failed for extension " + this._id + " - why " + 
          "not convert to the new chrome.manifest format while you're at it? " + 
          "Failure exception: " + e);
      showMessage("malformedRegistrationTitle", [], "malformedRegistrationMessage",
                  [BundleManager.appName]);

      var stageFile = this._installLocation.getStageFile(this._id);
      if (stageFile)
        this._installLocation.removeFile(stageFile);

      StartupCache.put(this._installLocation, this._id, OP_NEEDS_UNINSTALL, true);
      StartupCache.write();
    }
  }  
};

/**
 * Safely attempt to perform a caller-defined install operation for a given
 * item ID. Using aggressive success-safety checks, this function will attempt
 * to move an existing location for an item aside and then allow installation
 * into the appropriate folder. If any operation fails the installation will 
 * abort and roll back from the moved-aside old version.
 * @param   itemID
 *          The GUID of the item to perform the operation on.
 * @param   installLocation
 *          The Install Location where the item is installed.
 * @param   installCallback
 *          A caller supplied JS object with the following properties:
 *          "data"      A data parameter to be passed to the callback.
 *          "callback"  A function to perform the install operation. This
 *                      function is passed three parameters:
 *                      1. The GUID of the item being operated on.
 *                      2. The Install Location where the item is installed.
 *                      3. The "data" parameter on the installCallback object.
 */
function safeInstallOperation(itemID, installLocation, installCallback) {
  var movedFiles = [];
  
  /**
   * Reverts a deep move by moving backed up files back to their original
   * location.
   */
  function rollbackMove()
  {
    for (var i = 0; i < movedFiles.length; ++i) {
      var oldFile = movedFiles[i].oldFile;
      var newFile = movedFiles[i].newFile;
      try {
        newFile.moveTo(oldFile.parent, newFile.leafName);
      }
      catch (e) {
        LOG("safeInstallOperation: failed to roll back files after an install " + 
            "operation failed. Failed to roll back: " + newFile.path + " to: " + 
            oldFile.path + " ... aborting installation.");
        throw e;
      }
    }
  }
  
  /**
   * Moves a file to a new folder.
   * @param   file
   *          The file to move
   * @param   destination
   *          The target folder
   */
  function moveFile(file, destination) {
    try {
      var oldFile = file.clone();
      file.moveTo(destination, file.leafName);
      movedFiles.push({ oldFile: oldFile, newFile: file });
    }
    catch (e) {
      LOG("safeInstallOperation: failed to back up file: " + file.path + " to: " + 
          destination.path + " ... rolling back file moves and aborting " + 
          "installation.");
      rollbackMove();
      throw e;
    }
  }
  
  /**
   * Moves a directory to a new location. If any part of the move fails,
   * files already moved will be rolled back.
   * @param   sourceDir
   *          The directory to move
   * @param   targetDir
   *          The destination directory
   * @param   currentDir
   *          The current directory (a subdirectory of |sourceDir| or 
   *          |sourceDir| itself) we are moving files from.
   */
  function moveDirectory(sourceDir, targetDir, currentDir) {
    var entries = currentDir.directoryEntries.QueryInterface(nsIDirectoryEnumerator);
    while (true) {
      var entry = entries.nextFile;
      if (!entry)
        break;
      if (entry.isDirectory())
        moveDirectory(sourceDir, targetDir, entry);
      else if (entry instanceof nsILocalFile) {
        var rd = entry.getRelativeDescriptor(sourceDir);
        var destination = targetDir.clone().QueryInterface(nsILocalFile);
        destination.setRelativeDescriptor(targetDir, rd);
        moveFile(entry, destination.parent);
      }
    }
    entries.close();
  }
  
  /**
   * Removes the temporary backup directory where we stored files. 
   * @param   directory
   *          The backup directory to remove
   */
  function cleanUpTrash(directory) {
    try {
      // Us-generated. Safe.
      if (directory && directory.exists())
        removeDirRecursive(directory);
    }
    catch (e) {
      LOG("safeInstallOperation: failed to clean up the temporary backup of the " + 
          "older version: " + itemLocationTrash.path);
      // This is a non-fatal error. Annoying, but non-fatal. 
    }
  }
  
  if (!installLocation.itemIsManagedIndependently(itemID)) {
    var itemLocation = installLocation.getItemLocation(itemID);
    if (itemLocation.exists()) {
      var trashDirName = itemID + "-trash";
      var itemLocationTrash = itemLocation.parent.clone();
      itemLocationTrash.append(trashDirName);
      if (itemLocationTrash.exists()) {
        // We can remove recursively here since this is a folder we created, not
        // one the user specified. If this fails, it'll throw, and the caller 
        // should stop installation.
        try {
          removeDirRecursive(itemLocationTrash);
        }
        catch (e) {
          LOG("safeFileOperation: failed to remove existing trash directory " + 
              itemLocationTrash.path + " ... aborting installation.");
          throw e;
        }
      }
      
      // Move the directory that contains the existing version of the item aside, 
      // into {GUID}-trash. This will throw if there's a failure and the install
      // will abort.
      moveDirectory(itemLocation, itemLocationTrash, itemLocation);
      
      // Clean up the original location, if necessary. Again, this is a path we 
      // generated, so it is safe to recursively delete.
      try {
        removeDirRecursive(itemLocation);
      }
      catch (e) {
        LOG("safeInstallOperation: failed to clean up item location after its contents " + 
            "were properly backed up. Failed to clean up: " + itemLocation.path + 
            " ... rolling back file moves and aborting installation.");
        rollbackMove();
        cleanUpTrash(itemLocationTrash);
        throw e;
      }
    }
  }
  else if (installLocation.name == KEY_APP_PROFILE ||
           installLocation.name == KEY_APP_GLOBAL) {
    // Check for a pointer file and move it aside if it exists
    var pointerFile = installLocation.location.clone();
    pointerFile.append(itemID);
    if (pointerFile.exists() && !pointerFile.isDirectory()) {
      var trashFileName = itemID + "-trash";
      var itemLocationTrash = installLocation.location.clone();
      itemLocationTrash.append(trashFileName);
      if (itemLocationTrash.exists()) {
        // We can remove recursively here since this is a folder we created, not
        // one the user specified. If this fails, it'll throw, and the caller 
        // should stop installation.
        try {
          removeDirRecursive(itemLocationTrash);
        }
        catch (e) {
          LOG("safeFileOperation: failed to remove existing trash directory " + 
              itemLocationTrash.path + " ... aborting installation.");
          throw e;
        }
      }
      itemLocationTrash.create(nsILocalFile.DIRECTORY_TYPE, PERMS_DIRECTORY);
      // Move the pointer file to the trash.
      moveFile(pointerFile, itemLocationTrash);
    }
  }
      
  // Now tell the client to do their stuff.
  try {
    installCallback.callback(itemID, installLocation, installCallback.data);
  }
  catch (e) {
    // This means the install operation failed. Remove everything and roll back.
    LOG("safeInstallOperation: install operation (caller-supplied callback) failed, " + 
        "rolling back file moves and aborting installation.");
    try {
      // Us-generated. Safe.
      removeDirRecursive(itemLocation);
    }
    catch (e) {
      LOG("safeInstallOperation: failed to remove the folder we failed to install " + 
          "an item into: " + itemLocation.path + " -- There is not much to suggest " + 
          "here... maybe restart and try again?");
      cleanUpTrash(itemLocationTrash);
      throw e;
    }
    rollbackMove();
    cleanUpTrash(itemLocationTrash);
    throw e;        
  }
  
  // Now, and only now - after everything else has succeeded (against all odds!) 
  // remove the {GUID}-trash directory where we stashed the old version of the 
  // item.
  cleanUpTrash(itemLocationTrash);
}

/**
 * Manages the list of pending operations.
 */
var PendingOperations = {
  _ops: { },

  /**
   * Adds an entry to the Pending Operations List
   * @param   opType
   *          The type of Operation to be performed
   * @param   entry
   *          A JS Object representing the item to be operated on:
   *          "locationKey"   The name of the Install Location where the item
   *                          is installed.
   *          "id"            The GUID of the item.
   */
  addItem: function(opType, entry) {
    if (opType == OP_NONE)
      this.clearOpsForItem(entry.id);
    else {
      if (!(opType in this._ops))
        this._ops[opType] = { };
      this._ops[opType][entry.id] = entry.locationKey;
    }
  },
  
  /**
   * Removes a Pending Operation from the list
   * @param   opType
   *          The type of Operation being removed
   * @param   id
   *          The GUID of the item to remove the entry for
   */
  clearItem: function(opType, id) {
    if (opType in this._ops && id in this._ops[opType])
      delete this._ops[opType][id];
  },
  
  /**
   * Removes all Pending Operation for an item
   * @param   id
   *          The ID of the item to remove the entries for
   */
  clearOpsForItem: function(id) {
    for (var opType in this._ops) {
      if (id in this._ops[opType])
        delete this._ops[opType][id];
    }
  },

  /**
   * Remove all Pending Operations of a certain type
   * @param   opType
   *          The type of Operation to remove all entries for
   */
  clearItems: function(opType) {
    if (opType in this._ops)
      delete this._ops[opType];
  },
  
  /**
   * Get an array of operations of a certain type
   * @param   opType
   *          The type of Operation to return a list of
   */
  getOperations: function(opType) {
    if (!(opType in this._ops))
      return [];
    var ops = [];
    for (var id in this._ops[opType])
      ops.push( {id: id, locationKey: this._ops[opType][id] } );
    return ops;
  },
  
  /**
   * The total number of Pending Operations, for all types.
   */
  get size() {
    var size = 0;
    for (var opType in this._ops) {
      for (var id in this._ops[opType])
        ++size;
    }
    return size;
  }
};

/**
 * Manages registered Install Locations
 */
var InstallLocations = { 
  _locations: { },

  /**
   * A nsISimpleEnumerator of all available Install Locations.
   */
  get enumeration() {
    var installLocations = [];
    for (var key in this._locations) 
      installLocations.push(InstallLocations.get(key));
    return new ArrayEnumerator(installLocations);
  },
  
  /**
   * Gets a named Install Location
   * @param   name
   *          The name of the Install Location to get
   */
  get: function(name) {
    return name in this._locations ? this._locations[name] : null;
  },
  
  /**
   * Registers an Install Location
   * @param   installLocation
   *          The Install Location to register
   */
  put: function(installLocation) {
    this._locations[installLocation.name] = installLocation;
  }
};

/**
 * Manages the Startup Cache. The Startup Cache is a representation
 * of the contents of extensions.cache, a list of all
 * items the Extension System knows about, whether or not they
 * are active or visible.
 */
var StartupCache = {
  /**
   * Location Name -> GUID hash of entries from the Startup Cache file
   * Each entry has the following properties:
   *  "descriptor"    The location on disk of the item
   *  "mtime"         The time the location was last modified
   *  "op"            Any pending operations on this item.
   *  "location"      The Install Location name where the item is installed.
   */
  entries: { },

  /**
   * Puts an entry into the Startup Cache
   * @param   installLocation
   *          The Install Location where the item is installed
   * @param   id
   *          The GUID of the item
   * @param   op
   *          The name of the operation to be performed
   * @param   shouldCreate
   *          Whether or not we should create a new entry for this item
   *          in the cache if one does not already exist. 
   */
  put: function(installLocation, id, op, shouldCreate) {
    var itemLocation = installLocation.getItemLocation(id);

    var descriptor = null;
    var mtime = null;
    if (itemLocation) {
      itemLocation.QueryInterface(nsILocalFile);
      descriptor = getDescriptorFromFile(itemLocation, installLocation);
      if (itemLocation.exists() && itemLocation.isDirectory())
        mtime = Math.floor(itemLocation.lastModifiedTime / 1000);
    }

    this._putRaw(installLocation.name, id, descriptor, mtime, op, shouldCreate);
  },

  /**
   * Private helper function for putting an entry into the Startup Cache
   * without relying on the presence of its associated nsIInstallLocation
   * instance.
   *
   * @param key
   *        The install location name.
   * @param id
   *        The ID of the item.
   * @param descriptor
   *        Value returned from absoluteDescriptor.  May be null, in which
   *        case the descriptor field is not updated.
   * @param mtime
   *        The last modified time of the item.  May be null, in which case the
   *        descriptor field is not updated.
   * @param op
   *        The OP code to store with the entry.
   * @param shouldCreate
   *        Boolean value indicating whether to create or delete the entry.
   */
  _putRaw: function(key, id, descriptor, mtime, op, shouldCreate) {
    if (!(key in this.entries))
      this.entries[key] = { };
    if (!(id in this.entries[key]))
      this.entries[key][id] = { };
    if (shouldCreate) {
      if (!this.entries[key][id]) 
        this.entries[key][id] = { };

      var entry = this.entries[key][id];

      if (descriptor)
        entry.descriptor = descriptor;
      if (mtime) 
        entry.mtime = mtime;
      entry.op = op;
      entry.location = key;
    }
    else
      this.entries[key][id] = null;
  },
  
  /**
   * Clears an entry from the Startup Cache
   * @param   installLocation
   *          The Install Location where item is installed
   * @param   id
   *          The GUID of the item.
   */
  clearEntry: function(installLocation, id) {
    var key = installLocation.name;
    if (key in this.entries && id in this.entries[key])
      this.entries[key][id] = null;
  },
  
  /**
   * Get all the startup cache entries for a particular ID.
   * @param   id
   *          The GUID of the item to locate.
   * @returns An array of Startup Cache entries for the specified ID.
   */
  findEntries: function(id) {
    var entries = [];
    for (var key in this.entries) {
      if (id in this.entries[key]) 
        entries.push(this.entries[key][id]);
    }
    return entries;
  },

  /**
   * Call a function on each entry.  The callback function takes a single
   * parameter, which is an entry object.
   */
  forEachEntry: function(callback) {
    for (var key in this.entries) {
      for (id in this.entries[key])
        callback(this.entries[key][id]);
    }
  },
  
  /** 
   * Read the Item-Change manifest file into a hash of properties.
   * The Item-Change manifest currently holds a list of paths, with the last
   * mtime for each path, and the GUID of the item at that path.
   */
  read: function() {
    var itemChangeManifest = getFile(KEY_PROFILEDIR, [FILE_EXTENSIONS_STARTUP_CACHE]);
    if (!itemChangeManifest.exists()) {
      // There is no change manifest for some reason, either we're in an initial
      // state or something went wrong with one of the other files and the
      // change manifest was removed. Return an empty dataset and rebuild.
      return;
    }
    var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Components.interfaces.nsIFileInputStream);
    fis.init(itemChangeManifest, -1, -1, false);
    if (fis instanceof nsILineInputStream) {
      var line = { value: "" };
      var more = false;
      do {
        more = fis.readLine(line);
        if (line.value) {
          // The Item-Change manifest is formatted like so:
          //  (pd = descriptor)
          // location-key\tguid-of-item\tpd-to-extension1\tmtime-of-pd\tpending-op
          // location-key\tguid-of-item\tpd-to-extension2\tmtime-of-pd\tpending-op
          // ...
          // We hash on location-key first, because we don't want to have to 
          // spin up the main extensions datasource on every start to determine
          // the Install Location for an item.
          // We hash on guid second, because we want a way to quickly determine
          // item GUID during a check loop that runs on every startup.
          var parts = line.value.split("\t");
          var op = parts[4];
          this._putRaw(parts[0], parts[1], parts[2], parts[3], op, true);
          if (op)
            PendingOperations.addItem(op, { locationKey: parts[0], id: parts[1] });
        }
      }
      while (more);
    }
    fis.close();
  },

  /**
   * Writes the Startup Cache to disk
   */
  write: function() {
    var extensionsCacheFile = getFile(KEY_PROFILEDIR, [FILE_EXTENSIONS_STARTUP_CACHE]);
    var fos = openSafeFileOutputStream(extensionsCacheFile);
    for (var locationKey in this.entries) {
      for (var id in this.entries[locationKey]) {
        var entry = this.entries[locationKey][id];
        if (entry) {
          try {
            var itemLocation = getFileFromDescriptor(entry.descriptor, InstallLocations.get(locationKey));

            // Update our knowledge of this item's last-modified-time.
            // XXXdarin: this may cause us to miss changes in some cases.
            var itemMTime = 0;
            if (itemLocation.exists() && itemLocation.isDirectory())
              itemMTime = Math.floor(itemLocation.lastModifiedTime / 1000);

            // Each line in the startup cache manifest is in this form:
            // location-key\tid-of-item\tpd-to-extension1\tmtime-of-pd\tpending-op
            var line = locationKey + "\t" + id + "\t" + entry.descriptor + "\t" +
                       itemMTime + "\t" + entry.op + "\r\n";
            fos.write(line, line.length);
          }
          catch (e) {}
        }
      }
    }
    closeSafeFileOutputStream(fos);
  }
};

/**
 * Gets the current value of the locale.  It's possible for this preference to
 * be localized, so we have to do a little extra work here.  Similar code
 * exists in nsHttpHandler.cpp when building the UA string.
 */
function getLocale() {
  try {
      // Get the default branch
      var defaultPrefs = gPref.QueryInterface(Components.interfaces.nsIPrefService)
                              .getDefaultBranch(null);
      return defaultPrefs.getCharPref(PREF_GENERAL_USERAGENT_LOCALE);
  } catch (e) {}

  return gPref.getCharPref(PREF_GENERAL_USERAGENT_LOCALE);
}

/**
 * Read the update channel from defaults only.  We do this to ensure that
 * the channel is tightly coupled with the application and does not apply
 * to other installations of the application that may use the same profile.
 */
function getUpdateChannel() {
  var channel = "default";
  var prefName;
  var prefValue;

  var defaults =
      gPref.QueryInterface(Components.interfaces.nsIPrefService).
      getDefaultBranch(null);
  try {
    channel = defaults.getCharPref(PREF_APP_UPDATE_CHANNEL);
  } catch (e) {
    // use default when pref not found
  }

  try {
    var partners = gPref.getChildList(PREF_PARTNER_BRANCH, { });
    if (partners.length) {
      channel += "-cck";
      partners.sort();

      for each (prefName in partners) {
        prefValue = gPref.getCharPref(prefName);
        channel += "-" + prefValue;
      }
    }
  }
  catch (e) {
    Components.utils.reportError(e);
  }

  return channel;
}

/**
 * Manages the Blocklist. The Blocklist is a representation of the contents of
 * blocklist.xml and allows us to remotely disable / re-enable blocklisted
 * items managed by the Extension Manager with an item's appDisabled property.
 */
var Blocklist = {
  /**
   * Extension ID -> array of Version Ranges
   * Each value in the version range array is a JS Object that has the
   * following properties:
   *   "minVersion"  The minimum version in a version range (default = 0)
   *   "maxVersion"  The maximum version in a version range (default = *)
   *   "targetApps"  Application ID -> array of Version Ranges
   *                 (default = current application ID)
   *                 Each value in the version range array is a JS Object that
   *                 has the following properties:
   *                   "minVersion"  The minimum version in a version range
   *                                 (default = 0)
   *                   "maxVersion"  The maximum version in a version range
   *                                 (default = *)
   */
  entries: null,

  notify: function() {
    if (getPref("getBoolPref", PREF_BLOCKLIST_ENABLED, true) == false)
      return;

    try {
      var dsURI = gPref.getCharPref(PREF_BLOCKLIST_URL);
    }
    catch (e) {
      LOG("Blocklist::notify: The " + PREF_BLOCKLIST_URL + " preference" + 
          " is missing!");
      return;
    }

    dsURI = dsURI.replace(/%APP_ID%/g, gApp.ID);
    dsURI = dsURI.replace(/%APP_VERSION%/g, gApp.version);
    dsURI = dsURI.replace(/%PRODUCT%/g, gApp.name);
    dsURI = dsURI.replace(/%VERSION%/g, gApp.version);
    dsURI = dsURI.replace(/%BUILD_ID%/g, gApp.appBuildID);
    dsURI = dsURI.replace(/%BUILD_TARGET%/g, gApp.OS + "_" + gABI);
    dsURI = dsURI.replace(/%OS_VERSION%/g, gOSVersion);
    dsURI = dsURI.replace(/%LOCALE%/g, getLocale());
    dsURI = dsURI.replace(/%CHANNEL%/g, getUpdateChannel());
    dsURI = dsURI.replace(/%PLATFORM_VERSION%/g, gApp.platformVersion);
    // Distribution values are not present in 1.8 branch
    dsURI = dsURI.replace(/%DISTRIBUTION%/g, "default");
    dsURI = dsURI.replace(/%DISTRIBUTION_VERSION%/g, "default");
    dsURI = dsURI.replace(/\+/g, "%2B");

    // Verify that the URI is valid
    try {
      var uri = newURI(dsURI);
    }
    catch (e) {
      LOG("Blocklist::notify: There was an error creating the blocklist URI\r\n" + 
          "for: " + dsURI + ", error: " + e);
      return;
    }

    var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .createInstance(Components.interfaces.nsIXMLHttpRequest);
    request.open("GET", uri.spec, true);
    request.channel.notificationCallbacks = new BadCertHandler();
    request.overrideMimeType("text/xml");
    request.setRequestHeader("Cache-Control", "no-cache");

    var self = this;
    request.onerror = function(event) { self.onXMLError(event); };
    request.onload  = function(event) { self.onXMLLoad(event);  };
    request.send(null);
  },

  onXMLLoad: function(aEvent) {
    var request = aEvent.target;
    try {
      checkCert(request.channel);
    }
    catch (e) {
      LOG("Blocklist::onXMLLoad: " + e);
      return;
    }
    var responseXML = request.responseXML;
    if (!responseXML || responseXML.documentElement.namespaceURI == XMLURI_PARSE_ERROR ||
        (request.status != 200 && request.status != 0)) {
      LOG("Blocklist::onXMLLoad: there was an error during load");
      return;
    }
    var blocklistFile = getFile(KEY_PROFILEDIR, [FILE_BLOCKLIST]);
    if (blocklistFile.exists())
      blocklistFile.remove(false);
    var fos = openSafeFileOutputStream(blocklistFile);
    fos.write(request.responseText, request.responseText.length);
    closeSafeFileOutputStream(fos);
    this.entries = this._loadBlocklistFromFile(getFile(KEY_PROFILEDIR,
                                                       [FILE_BLOCKLIST]));
    var em = Components.classes["@mozilla.org/extensions/manager;1"]
                       .getService(Components.interfaces.nsIExtensionManager)
                       .QueryInterface(Components.interfaces.nsIExtensionManager_MOZILLA_1_8_BRANCH);
    em.checkForBlocklistChanges();
  },

  onXMLError: function(aEvent) {
    try {
      var request = aEvent.target;
      // the following may throw (e.g. a local file or timeout)
      var status = request.status;
    }
    catch (e) {
      request = aEvent.target.channel.QueryInterface(Components.interfaces.nsIRequest);
      status = request.status;
    }
    var statusText = request.statusText;
    // When status is 0 we don't have a valid channel.
    if (status == 0)
      statusText = "nsIXMLHttpRequest channel unavailable";
    LOG("Blocklist:onError: There was an error loading the blocklist file\r\n" + 
        statusText);
  },

  /**
   * The blocklist XML file looks something like this:
   *
   * <blocklist xmlns="http://www.mozilla.org/2006/addons-blocklist">
   *   <emItems>
   *     <emItem id="item_1@domain">
   *       <versionRange minVersion="1.0" maxVersion="2.0.*">
   *         <targetApplication id="{ec8030f7-c20a-464f-9b0e-13a3a9e97384}">
   *           <versionRange minVersion="1.5" maxVersion="1.5.*"/>
   *           <versionRange minVersion="1.7" maxVersion="1.7.*"/>
   *         </targetApplication>
   *         <targetApplication id="toolkit@mozilla.org">
   *           <versionRange minVersion="1.8" maxVersion="1.8.*"/>
   *         </targetApplication>
   *       </versionRange>
   *       <versionRange minVersion="3.0" maxVersion="3.0.*">
   *         <targetApplication id="{ec8030f7-c20a-464f-9b0e-13a3a9e97384}">
   *           <versionRange minVersion="1.5" maxVersion="1.5.*"/>
   *         </targetApplication>
   *         <targetApplication id="toolkit@mozilla.org">
   *           <versionRange minVersion="1.8" maxVersion="1.8.*"/>
   *         </targetApplication>
   *       </versionRange>
   *     </emItem>
   *     <emItem id="item_2@domain">
   *       <versionRange minVersion="3.1" maxVersion="4.*"/>
   *     </emItem>
   *     <emItem id="item_3@domain">
   *       <versionRange>
   *         <targetApplication id="{ec8030f7-c20a-464f-9b0e-13a3a9e97384}">
   *           <versionRange minVersion="1.5" maxVersion="1.5.*"/>
   *         </targetApplication>
   *       </versionRange>
   *     </emItem>
   *     <emItem id="item_4@domain">
   *       <versionRange>
   *         <targetApplication>
   *           <versionRange minVersion="1.5" maxVersion="1.5.*"/>
   *         </targetApplication>
   *       </versionRange>
   *     <emItem id="item_5@domain"/>
   *   </emItems>
   * </blocklist> 
   */
  _loadBlocklistFromFile: function(file) {
    if (getPref("getBoolPref", PREF_BLOCKLIST_ENABLED, true) == false) {
      LOG("Blocklist::_loadBlocklistFromFile: blocklist is disabled");
      return { };
    }

    if (!file.exists()) {
      LOG("Blocklist::_loadBlocklistFromFile: XML File does not exist");
      return { };
    }

    var result = { };
    var fileStream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                               .createInstance(Components.interfaces.nsIFileInputStream);
    fileStream.init(file, MODE_RDONLY, PERMS_FILE, 0);
    try {
      var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                             .createInstance(Components.interfaces.nsIDOMParser);
      var doc = parser.parseFromStream(fileStream, "UTF-8", file.fileSize, "text/xml");
      if (doc.documentElement.namespaceURI != XMLURI_BLOCKLIST) {
        LOG("Blocklist::_loadBlocklistFromFile: aborting due to incorrect " +
            "XML Namespace.\r\nExpected: " + XMLURI_BLOCKLIST + "\r\n" +
            "Received: " + doc.documentElement.namespaceURI);
        return { };
      }

      const kELEMENT_NODE = Components.interfaces.nsIDOMNode.ELEMENT_NODE;
      var itemNodes = this._getItemNodes(doc.documentElement.childNodes);
      for (var i = 0; i < itemNodes.length; ++i) {
        var blocklistElement = itemNodes[i];
        if (blocklistElement.nodeType != kELEMENT_NODE ||
            blocklistElement.localName != "emItem")
          continue;

        blocklistElement.QueryInterface(Components.interfaces.nsIDOMElement);
        var versionNodes = blocklistElement.childNodes;
        var id = blocklistElement.getAttribute("id");
        result[id] = [];
        for (var x = 0; x < versionNodes.length; ++x) {
          var versionRangeElement = versionNodes[x];
          if (versionRangeElement.nodeType != kELEMENT_NODE ||
              versionRangeElement.localName != "versionRange")
            continue;

          result[id].push(new BlocklistItemData(versionRangeElement));
        }
        // if only the extension ID is specified block all versions of the
        // extension for the current application.
        if (result[id].length == 0)
          result[id].push(new BlocklistItemData(null));
      }
    }
    catch (e) {
      LOG("Blocklist::_loadBlocklistFromFile: Error constructing blocklist " + e);
      return { };
    }
    fileStream.close();
    return result;
  },

  _getItemNodes: function(deChildNodes) {
    const kELEMENT_NODE = Components.interfaces.nsIDOMNode.ELEMENT_NODE;
    for (var i = 0; i < deChildNodes.length; ++i) {
      var emItemsElement = deChildNodes[i];
      if (emItemsElement.nodeType == kELEMENT_NODE &&
          emItemsElement.localName == "emItems")
        return emItemsElement.childNodes;
    }
    return [ ];
  },

  _ensureBlocklist: function() {
    if (!this.entries)
      this.entries = this._loadBlocklistFromFile(getFile(KEY_PROFILEDIR, 
                                                         [FILE_BLOCKLIST]));
  }
};

/**
 * Helper for constructing a blocklist.
 */
function BlocklistItemData(versionRangeElement) {
  var versionRange = this.getBlocklistVersionRange(versionRangeElement);
  this.minVersion = versionRange.minVersion;
  this.maxVersion = versionRange.maxVersion;
  this.targetApps = { };
  var found = false;

  if (versionRangeElement) {
    for (var i = 0; i < versionRangeElement.childNodes.length; ++i) {
      var targetAppElement = versionRangeElement.childNodes[i];
      if (targetAppElement.nodeType != Components.interfaces.nsIDOMNode.ELEMENT_NODE ||
          targetAppElement.localName != "targetApplication")
        continue;
      found = true;
      // default to the current application if id is not provided.
      var appID = targetAppElement.hasAttribute("id") ? targetAppElement.getAttribute("id") : gApp.ID;
      this.targetApps[appID] = this.getBlocklistAppVersions(targetAppElement);
    }
  }
  // Default to all versions of the extension and the current application when
  // versionRange is not defined.
  if (!found)
    this.targetApps[gApp.ID] = this.getBlocklistAppVersions(null);
}

BlocklistItemData.prototype = {
/**
 * Retrieves a version range (e.g. minVersion and maxVersion) for a
 * blocklist item's targetApplication element.
 * @param   targetAppElement
 *          A targetApplication blocklist element.
 * @returns An array of JS objects with the following properties:
 *          "minVersion"  The minimum version in a version range (default = 0).
 *          "maxVersion"  The maximum version in a version range (default = *).
 */
  getBlocklistAppVersions: function(targetAppElement) {
    var appVersions = [ ];
    var found = false;

    if (targetAppElement) {
      for (var i = 0; i < targetAppElement.childNodes.length; ++i) {
        var versionRangeElement = targetAppElement.childNodes[i];
        if (versionRangeElement.nodeType != Components.interfaces.nsIDOMNode.ELEMENT_NODE ||
            versionRangeElement.localName != "versionRange")
          continue;
        found = true;
        appVersions.push(this.getBlocklistVersionRange(versionRangeElement));
      }
    }
    // return minVersion = 0 and maxVersion = * if not available
    if (!found)
      return [ this.getBlocklistVersionRange(null) ];
    return appVersions;
  },

/**
 * Retrieves a version range (e.g. minVersion and maxVersion) for a blocklist
 * versionRange element.
 * @param   versionRangeElement
 *          The versionRange blocklist element.
 * @returns A JS object with the following properties:
 *          "minVersion"  The minimum version in a version range (default = 0).
 *          "maxVersion"  The maximum version in a version range (default = *).
 */
  getBlocklistVersionRange: function(versionRangeElement) {
    var minVersion = "0";
    var maxVersion = "*";
    if (!versionRangeElement)
      return { minVersion: minVersion, maxVersion: maxVersion };

    if (versionRangeElement.hasAttribute("minVersion"))
      minVersion = versionRangeElement.getAttribute("minVersion");
    if (versionRangeElement.hasAttribute("maxVersion"))
      maxVersion = versionRangeElement.getAttribute("maxVersion");

    return { minVersion: minVersion, maxVersion: maxVersion };
  }
};

/**
 * Installs, manages and tracks compatibility for Extensions and Themes
 * @constructor
 */
function ExtensionManager() {
  gApp = Components.classes["@mozilla.org/xre/app-info;1"]
                   .getService(Components.interfaces.nsIXULAppInfo)
                   .QueryInterface(Components.interfaces.nsIXULRuntime);
  gOSTarget = gApp.OS;
  try {
    gXPCOMABI = gApp.XPCOMABI;
  } catch (ex) {
    // Provide a default for gXPCOMABI. It won't be compared to an
    // item's metadata (i.e. install.rdf can't specify e.g. WINNT_unknownABI
    // as targetPlatform), but it will be displayed in error messages and
    // transmitted to update URLs.
    gXPCOMABI = UNKNOWN_XPCOM_ABI;
  }
  gABI = gXPCOMABI;

  var osVersion;
  var sysInfo = Components.classes["@mozilla.org/system-info;1"]
                          .getService(Components.interfaces.nsIPropertyBag2);
  try {
    osVersion = sysInfo.getProperty("name") + " " + sysInfo.getProperty("version");
  }
  catch (e) {
    LOG("ExtensionManager: OS Version unknown.");
  }

  if (osVersion) {
    try {
      osVersion += " (" + sysInfo.getProperty("secondaryLibrary") + ")";
    }
    catch (e) {
      // Not all platforms have a secondary widget library, so an error is nothing to worry about.
    }
    gOSVersion = encodeURIComponent(osVersion);
  }

//@line 2764 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"

  gPref = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch2);

  gOS = Components.classes["@mozilla.org/observer-service;1"]
                  .getService(Components.interfaces.nsIObserverService);
  gOS.addObserver(this, "xpcom-shutdown", false);

  gConsole = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);  
  
  gRDF = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                   .getService(Components.interfaces.nsIRDFService);
  gInstallManifestRoot = gRDF.GetResource(RDFURI_INSTALL_MANIFEST_ROOT);
  
  // Register Global Install Location
  var appGlobalExtensions = getDirNoCreate(KEY_APPDIR, [DIR_EXTENSIONS]);
  var priority = nsIInstallLocation.PRIORITY_APP_SYSTEM_GLOBAL;
  var globalLocation = new DirectoryInstallLocation(KEY_APP_GLOBAL, 
                                                    appGlobalExtensions, true,
                                                    priority);
  InstallLocations.put(globalLocation);

  // Register App-Profile Install Location
  var appProfileExtensions = getDirNoCreate(KEY_PROFILEDS, [DIR_EXTENSIONS]);
  var priority = nsIInstallLocation.PRIORITY_APP_PROFILE;
  var profileLocation = new DirectoryInstallLocation(KEY_APP_PROFILE, 
                                                     appProfileExtensions, false,
                                                     priority);
  InstallLocations.put(profileLocation);

//@line 2810 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"

  // Register Additional Install Locations
  var categoryManager = Components.classes["@mozilla.org/categorymanager;1"]
                                  .getService(Components.interfaces.nsICategoryManager);
  var locations = categoryManager.enumerateCategory(CATEGORY_INSTALL_LOCATIONS);
  while (locations.hasMoreElements()) {
    var entry = locations.getNext().QueryInterface(Components.interfaces.nsISupportsCString).data;
    var contractID = categoryManager.getCategoryEntry(CATEGORY_INSTALL_LOCATIONS, entry);
    var location = Components.classes[contractID].getService(nsIInstallLocation);
    InstallLocations.put(location);
  }
}

ExtensionManager.prototype = {
  /**
   * See nsIObserver.idl
   */
  observe: function(subject, topic, data) {
    switch (topic) {
    case "app-startup":
      gOS.addObserver(this, "profile-after-change", false);
      break;
    case "profile-after-change":
      this._profileSelected();
      break;
    case "quit-application-requested":
      this._confirmCancelDownloadsOnQuit(subject);
      break;
    case "offline-requested":
      this._confirmCancelDownloadsOnOffline(subject);
      break;
    case "xpcom-shutdown":
      this._shutdown();
      break;
    case "nsPref:changed":
      if (data == PREF_EM_LOGGING_ENABLED)
        this._loggingToggled();
      else if (data == PREF_EM_CHECK_COMPATIBILITY)
        this._checkCompatToggled();
      break;
    }
  },
  
  /**
   * Refresh the logging enabled global from preferences when the user changes
   * the preference settting.
   */
  _loggingToggled: function() {
    gLoggingEnabled = getPref("getBoolPref", PREF_EM_LOGGING_ENABLED, false);
  },

  /**
   * Enables or disables extensions that are incompatible depending upon the pref
   * setting for compatibility checking.
   */
  _checkCompatToggled: function() {
    gCheckCompatibility = getPref("getBoolPref", PREF_EM_CHECK_COMPATIBILITY, true);
    var ds = this.datasource;

    // Enumerate all items
    var ctr = getContainer(ds, ds._itemRoot);
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var itemResource = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);

      // App disable or enable items as necessary
      // _appEnableItem and _appDisableItem will do nothing if the item is already
      // in the right state.
      id = stripPrefix(itemResource.Value, PREFIX_ITEM_URI);
      if (this._isUsableItem(id))
        this._appEnableItem(id);
      else
        this._appDisableItem(id);
    }
  },

  /**
   * Initialize the system after a profile has been selected.
   */  
  _profileSelected: function() {
    // Tell the Chrome Registry which Skin to select
    try {
      if (gPref.getBoolPref(PREF_DSS_SWITCHPENDING)) {
        var toSelect = gPref.getCharPref(PREF_DSS_SKIN_TO_SELECT);
        gPref.setCharPref(PREF_GENERAL_SKINS_SELECTEDSKIN, toSelect);
        gPref.clearUserPref(PREF_DSS_SWITCHPENDING);
        gPref.clearUserPref(PREF_DSS_SKIN_TO_SELECT);
      }
    }
    catch (e) {
    }
    gLoggingEnabled = getPref("getBoolPref", PREF_EM_LOGGING_ENABLED, false);
    gCheckCompatibility = getPref("getBoolPref", PREF_EM_CHECK_COMPATIBILITY, true);
    gPref.addObserver("extensions.", this, false);
  },

  /**
   * Notify user that there are new addons updates
   */
  _showUpdatesWindow: function() {
    if (!getPref("getBoolPref", PREF_UPDATE_NOTIFYUSER, false))
      return;

    const EMURL = "chrome://mozapps/content/extensions/extensions.xul";
    const EMFEATURES = "chrome,centerscreen,extra-chrome,dialog,resizable,modal";

    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                       .getService(Components.interfaces.nsIWindowWatcher);
    var param = Components.classes["@mozilla.org/supports-array;1"]
                          .createInstance(Components.interfaces.nsISupportsArray);
    var arg = Components.classes["@mozilla.org/supports-string;1"]
                        .createInstance(Components.interfaces.nsISupportsString);
    arg.data = "updates-only";
    param.AppendElement(arg);
    ww.openWindow(null, EMURL, null, EMFEATURES, param);
  },

  /**
   * Clean up on application shutdown to avoid leaks.
   */
  _shutdown: function() {
    gOS.removeObserver(this, "xpcom-shutdown");

    // Release strongly held services.
    gOS = null;
    if (this._ds && gRDF) 
      gRDF.UnregisterDataSource(this._ds)
    gRDF = null;
    if (gPref)
      gPref.removeObserver("extensions.", this);
    gPref = null;
    gConsole = null;
    gVersionChecker = null;
    gInstallManifestRoot = null;
    gApp = null;
  },
  
  /**
   * Check for presence of critical Extension system files. If any is missing, 
   * delete the others and signal that the system needs to rebuild them all
   * from scratch.
   * @returns true if any critical file is missing and the system needs to
   *          be rebuilt, false otherwise.
   */
  _ensureDatasetIntegrity: function () {
    var extensionsDS = getFile(KEY_PROFILEDIR, [FILE_EXTENSIONS]);
    var extensionsINI = getFile(KEY_PROFILEDIR, [FILE_EXTENSION_MANIFEST]);
    var extensionsCache = getFile(KEY_PROFILEDIR, [FILE_EXTENSIONS_STARTUP_CACHE]);
    
    var dsExists = extensionsDS.exists();
    var iniExists = extensionsINI.exists();
    var cacheExists = extensionsCache.exists();
 
    if (dsExists && iniExists && cacheExists)
      return false;

    // If any of the files are missing, remove the .ini file
    if (iniExists)
      extensionsINI.remove(false);

    // If the extensions datasource is missing remove the .cache file if it exists
    if (!dsExists && cacheExists)
      extensionsCache.remove(false);

    return true;
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  start: function(commandLine) {
    var isDirty = false;
    var forceAutoReg = false;
    
    this._showUpdatesWindow();
    
    // Somehow the component list went away, and for that reason the new one
    // generated by this function is going to result in a different compreg.
    // We must force a restart.
    var componentList = getFile(KEY_PROFILEDIR, [FILE_EXTENSION_MANIFEST]);
    if (!componentList.exists())
      forceAutoReg = true;
    
    // Check for missing manifests - e.g. missing extensions.ini, missing
    // extensions.cache, extensions.rdf etc. If any of these files 
    // is missing then we are in some kind of weird or initial state and need
    // to force a regeneration.
    if (this._ensureDatasetIntegrity())
      isDirty = true;

    // Configure any items that are being installed, uninstalled or upgraded 
    // by being added, removed or modified by another process. We must do this
    // on every startup since there is no way we can tell if this has happened
    // or not!
    if (this._checkForFileChanges())
      isDirty = true;

    if (PendingOperations.size != 0)
      isDirty = true;

    // Extension Changes
    if (isDirty) {
      var needsRestart = this._finishOperations();

      if (forceAutoReg) {
        this._extensionListChanged = true;
        needsRestart = true;
      }
      return needsRestart;
    }
      
    this._startTimers();

    return false;
  },
  
  /**
   * Begins all background update check timers
   */
  _startTimers: function() {
    // Register a background update check timer
    var tm = 
        Components.classes["@mozilla.org/updates/timer-manager;1"]
                  .getService(Components.interfaces.nsIUpdateTimerManager);
    var interval = getPref("getIntPref", PREF_EM_UPDATE_INTERVAL, 86400); 
    tm.registerTimer("addon-background-update-timer", this, interval);

    interval = getPref("getIntPref", PREF_BLOCKLIST_INTERVAL, 86400); 
    tm.registerTimer("blocklist-background-update-timer", Blocklist, interval);
  },
  
  /**
   * Notified when a timer fires
   * @param   timer
   *          The timer that fired
   */
  notify: function(timer) {
    if (!getPref("getBoolPref", PREF_EM_UPDATE_ENABLED, true))
      return;

    var items = this.getItemList(nsIUpdateItem.TYPE_ADDON, { });

    var updater = new ExtensionItemUpdater(gApp.ID, gApp.version, this);
    updater._background = true;
    updater.checkForUpdates(items, items.length, false, null);
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  handleCommandLineArgs: function(commandLine) {
    try {
      var globalExtension = commandLine.handleFlagWithParam("install-global-extension", false);
      if (globalExtension) {
        var file = commandLine.resolveFile(globalExtension);
        this._installGlobalItem(file);
      }
      var globalTheme = commandLine.handleFlagWithParam("install-global-theme", false);
      if (globalTheme) {
        file = commandLine.resolveFile(globalTheme);
        this._installGlobalItem(file);
      }
    }
    catch (e) { 
      LOG("ExtensionManager:handleCommandLineArgs - failure, catching exception - lineno: " +
          e.lineNumber + " - file: " + e.fileName + " - " + e);
    }
    commandLine.preventDefault = true;
  },

  /**
   * Installs an XPI/JAR file into the KEY_APP_GLOBAL install location.
   * @param   file
   *          The XPI/JAR file to extract
   */
  _installGlobalItem: function(file) {
    if (!file || !file.exists())
      throw new Error("Unable to find the file specified on the command line!");
//@line 3094 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"
    var installManifestFile = extractRDFFileToTempDir(file, FILE_INSTALL_MANIFEST, true);
    if (!installManifestFile.exists())
      throw new Error("The package is missing an install manifest!");
    var installManifest = getInstallManifest(installManifestFile);
    installManifestFile.remove(false);
    var installData = this._getInstallData(installManifest);
    var installer = new Installer(installManifest, installData.id,
                                  InstallLocations.get(KEY_APP_GLOBAL),
                                  installData.type);
    installer._installExtensionFiles(file);
    if (installData.type == nsIUpdateItem.TYPE_THEME)
      installer.upgradeThemeChrome();
    else
      installer.upgradeExtensionChrome();
  },

  /**
   * Check to see if a file is a XPI/JAR file that the user dropped into this
   * Install Location. (i.e. a XPI that is not a staged XPI from an install 
   * transaction that is currently in operation). 
   * @param   file
   *          The XPI/JAR file to configure
   * @param   location
   *          The Install Location where this file was found.
   * @returns A nsIUpdateItem representing the dropped XPI if this file was a 
   *          XPI/JAR that needs installation, null otherwise.
   */
  _getItemForDroppedFile: function(file, location) {
    if (fileIsItemPackage(file)) {
      // We know nothing about this item, it is not something we've
      // staged in preparation for finalization, so assume it's something
      // the user dropped in.
      LOG("A Item Package appeared at: " + file.path + " that we know " + 
          "nothing about, assuming it was dropped in by the user and " + 
          "configuring for installation now. Location Key: " + location.name);

      var installManifestFile = extractRDFFileToTempDir(file, FILE_INSTALL_MANIFEST, true);
      if (!installManifestFile.exists())
        return null;
      var installManifest = getInstallManifest(installManifestFile);
      installManifestFile.remove(false);
      var ds = this.datasource;
      var installData = this._getInstallData(installManifest);
      var targetAppInfo = ds.getTargetApplicationInfo(installData.id, installManifest);
      return makeItem(installData.id,
                      installData.version,
                      location.name,
                      targetAppInfo ? targetAppInfo.minVersion : "",
                      targetAppInfo ? targetAppInfo.maxVersion : "",
                      getManifestProperty(installManifest, "name"),
                      "", /* XPI Update URL */
                      "", /* XPI Update Hash */
                      getManifestProperty(installManifest, "iconURL"),
                      getManifestProperty(installManifest, "updateURL"),
                      installData.type);
    }
    return null;
  },
  
  /**
   * Check for changes to items that were made independently of the Extension 
   * Manager, e.g. items were added or removed from a Install Location or items
   * in an Install Location changed. 
   */
  _checkForFileChanges: function() {
    var em = this;
    /** 
     * Configure an item that was installed or upgraded by another process
     * so that |_finishOperations| can properly complete processing and 
     * registration. 
     * As this is the only point at which we can reliably know the Install
     * Location of this item, we use this as an opportunity to:
     * 1. Check that this item is compatible with this Firefox version.
     * 2. If it is, configure the item by using the supplied callback.
     *    We do not do any special handling in the case that the item is
     *    not compatible with this version other than to simply not register
     *    it and log that fact - there is no "phone home" check for updates. 
     *    It may or may not make sense to do this, but for now we'll just
     *    not register.
     * @param   id
     *          The GUID of the item to validate and configure.
     * @param   location
     *          The Install Location where this item is installed.
     * @param   callback
     *          The callback that configures the item for installation upon
     *          successful validation.
     */      
    function installItem(id, location, callback) {
      // As this is the only pint at which we reliably know the installation
      var installRDF = location.getItemFile(id, FILE_INSTALL_MANIFEST);
      if (installRDF.exists()) {
        LOG("Item Installed/Upgraded at Install Location: " + location.name + 
            " Item ID: " + id + ", attempting to register...");
        var installManifest = getInstallManifest(installRDF);
        var installData = em._getInstallData(installManifest);
        if (installData.error == INSTALLERROR_SUCCESS) {
          LOG("... success, item is compatible");
          callback(installManifest, installData.id, location, installData.type);
        }
        else if (installData.error == INSTALLERROR_INCOMPATIBLE_VERSION) {
          LOG("... success, item installed but is not compatible");
          callback(installManifest, installData.id, location, installData.type);
          em._appDisableItem(id);
        }
        else if (installData.error == INSTALLERROR_BLOCKLISTED) {
          LOG("... success, item installed but is blocklisted");
          callback(installManifest, installData.id, location, installData.type);
          em._appDisableItem(id);
        }
        else {
          /**
           * Turns an error code into a message for logging
           * @param   error
           *          an Install Error code
           * @returns A string message to be logged.
           */
          function translateErrorMessage(error) {
            switch (error) {
            case INSTALLERROR_INVALID_GUID:
              return "Invalid GUID";
            case INSTALLERROR_INVALID_VERSION:
              return "Invalid Version";
            case INSTALLERROR_INCOMPATIBLE_VERSION:
              return "Incompatible Version";
            case INSTALLERROR_INCOMPATIBLE_PLATFORM:
              return "Incompatible Platform";
            }
          }
          LOG("... failure, item is not compatible, error: " + 
              translateErrorMessage(installData.error));

          // Add the item to the Startup Cache anyway, so we don't re-detect it
          // every time the app starts.
          StartupCache.put(location, id, OP_NONE, true);
        }
      }      
    }
  
    /**
     * Determines if an item can be used based on whether or not the install
     * location of the "item" has an equal or higher priority than the install
     * location where another version may live.
     * @param   id
     *          The GUID of the item being installed.
     * @param   location
     *          The location where an item is to be installed.
     * @returns true if the item can be installed at that location, false 
     *          otherwise.
     */
    function canUse(id, location) {
      for (var locationKey in StartupCache.entries) {
        if (locationKey != location.name && 
            id in StartupCache.entries[locationKey]) {
          if (StartupCache.entries[locationKey][id]) {
            var oldInstallLocation = InstallLocations.get(locationKey);
            if (oldInstallLocation.priority <= location.priority)
              return false;
          }
        }
      }
      return true;
    }
    
    /** 
      * Gets a Dialog Param Block loaded with a set of strings to initialize the
      * XPInstall Confirmation Dialog.
      * @param   strings
      *          An array of strings
      * @returns A nsIDialogParamBlock loaded with the strings and dialog state.
      */
    function getParamBlock(strings) {
      var dpb = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                          .createInstance(Components.interfaces.nsIDialogParamBlock);
      // OK and Cancel Buttons
      dpb.SetInt(0, 2);
      // Number of Strings
      dpb.SetInt(1, strings.length);
      dpb.SetNumberStrings(strings.length);
      // Add Strings
      for (var i = 0; i < strings.length; ++i)
        dpb.SetString(i, strings[i]);
      
      var supportsString = Components.classes["@mozilla.org/supports-string;1"]
                                     .createInstance(Components.interfaces.nsISupportsString);
      var bundle = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
      supportsString.data = bundle.GetStringFromName("droppedInWarning");
      var objs = Components.classes["@mozilla.org/array;1"]
                           .createInstance(Components.interfaces.nsIMutableArray);
      objs.appendElement(supportsString, false);
      dpb.objects = objs;
      return dpb;        
    }

    /**
     * Installs a set of files which were dropped into an install location by 
     * the user, only after user confirmation.
     * @param   droppedInFiles
     *          An array of JS objects with the following properties:
     *          "file"      The nsILocalFile where the XPI lives
     *          "location"  The Install Location where the XPI was found. 
     * @param   xpinstallStrings
     *          An array of strings used to initialize the XPInstall Confirm 
     *          dialog.
     */ 
    function installDroppedInFiles(droppedInFiles, xpinstallStrings) {
      if (droppedInFiles.length == 0) 
        return;
        
      var dpb = getParamBlock(xpinstallStrings);
      var ifptr = Components.classes["@mozilla.org/supports-interface-pointer;1"]
                            .createInstance(Components.interfaces.nsISupportsInterfacePointer);
      ifptr.data = dpb;
      ifptr.dataIID = Components.interfaces.nsIDialogParamBlock;
      var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                          .getService(Components.interfaces.nsIWindowWatcher);
      ww.openWindow(null, URI_XPINSTALL_CONFIRM_DIALOG, 
                    "", "chrome,centerscreen,modal,dialog,titlebar", ifptr);
      if (!dpb.GetInt(0)) {
        // User said OK - install items
        for (var i = 0; i < droppedInFiles.length; ++i) {
          em.installItemFromFile(droppedInFiles[i].file, 
                                 droppedInFiles[i].location.name);
          // We are responsible for cleaning up this file
          droppedInFiles[i].file.remove(false);
        }
      }
      else {
        for (i = 0; i < droppedInFiles.length; ++i) {
          // We are responsible for cleaning up this file
          droppedInFiles[i].file.remove(false);
        }
      }
    }
    
    var isDirty = false;
    var ignoreMTimeChanges = getPref("getBoolPref", PREF_EM_IGNOREMTIMECHANGES,
                                     false);
    StartupCache.read();
    
    // Array of objects with 'location' and 'id' properties to maybe install.
    var newItems = [];

    var droppedInFiles = [];
    var xpinstallStrings = [];
    
    // Enumerate over the install locations from low to high priority.  The
    // enumeration returned is pre-sorted.
    var installLocations = this.installLocations;
    while (installLocations.hasMoreElements()) {
      var location = installLocations.getNext().QueryInterface(nsIInstallLocation);

      // Hash the set of items actually held by the Install Location.  
      var actualItems = { };
      var entries = location.itemLocations;
      while (true) {
        var entry = entries.nextFile;
        if (!entry)
          break;

        // Is this location a valid item? It must be a directory, and contain
        // an install.rdf manifest:
        if (entry.isDirectory()) {
          var installRDF = entry.clone();
          installRDF.append(FILE_INSTALL_MANIFEST);

          var id = location.getIDForLocation(entry);
          if (!id || (!installRDF.exists() && 
                      !location.itemIsManagedIndependently(id)))
            continue;

          actualItems[id] = entry;
        }
        else {
          // Check to see if this file is a XPI/JAR dropped into this dir
          // by the user, installing it if necessary. We do this here rather
          // than separately in |_finishOperations| because I don't want to
          // walk these lists multiple times on every startup.
          var item = this._getItemForDroppedFile(entry, location);
          if (item) {
            droppedInFiles.push({ file: entry, location: location });

            var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                                      .createInstance(Components.interfaces.nsIZipReader);
            zipReader.init(entry);
            var prettyName = "";
            try {
              var jar = zipReader.QueryInterface(Components.interfaces.nsIJAR);
              var principal = { };
              var certPrincipal = zipReader.getCertificatePrincipal(null, principal);
              // XXXbz This string could be empty.  This needs better
              // UI to present principal.value.certificate's subject.
              prettyName = principal.value.prettyName;
            }
            catch (e) { }
            xpinstallStrings = xpinstallStrings.concat([item.name, 
                                                        getURLSpecFromFile(entry),
                                                        item.iconURL, 
                                                        prettyName]);
            isDirty = true;
          }
        }
      }
      
      if (location.name in StartupCache.entries) {
        // Look for items that have been uninstalled by removing their directory.
        for (var id in StartupCache.entries[location.name]) {
          if (!StartupCache.entries[location.name] ||
              !StartupCache.entries[location.name][id]) 
            continue;

          // Force _finishOperations to run if we have enabled or disabled items.
          // XXXdarin this should be unnecessary now that we check
          // PendingOperations.size in start()
          if (StartupCache.entries[location.name][id].op == OP_NEEDS_ENABLE ||
              StartupCache.entries[location.name][id].op == OP_NEEDS_DISABLE)
            isDirty = true;
          
          if (!(id in actualItems) && 
              StartupCache.entries[location.name][id].op != OP_NEEDS_UNINSTALL &&
              StartupCache.entries[location.name][id].op != OP_NEEDS_INSTALL &&
              StartupCache.entries[location.name][id].op != OP_NEEDS_UPGRADE) {
            // We have an entry for this id in the Extensions database, for this 
            // install location, but it no longer exists in the Install Location. 
            // We can infer from this that the item has been removed, so uninstall
            // it properly. 
            if (canUse(id, location)) {
              LOG("Item Uninstalled via file removal from: " + StartupCache.entries[location.name][id].descriptor + 
                  " Item ID: " + id + " Location Key: " + location.name + ", uninstalling item.");
              
              // Load the Extensions Datasource and force this item into the visible
              // items list if it is not already. This allows us to handle the case 
              // where there is an entry for an item in the Startup Cache but not
              // in the extensions.rdf file - in that case the item will not be in
              // the visible list and calls to |getInstallLocation| will mysteriously
              // fail.
              this.datasource.updateVisibleList(id, location.name, false);
              this.uninstallItem(id);
              isDirty = true;
            }
          }
          else if (!ignoreMTimeChanges) {
            // Look for items whose mtime has changed, and as such we can assume 
            // they have been "upgraded".
            var lf = { path: StartupCache.entries[location.name][id].descriptor };
            try {
               lf = getFileFromDescriptor(StartupCache.entries[location.name][id].descriptor, location);
            }
            catch (e) { }

            if (lf.exists && lf.exists()) {
              var actualMTime = Math.floor(lf.lastModifiedTime / 1000);
              if (actualMTime != StartupCache.entries[location.name][id].mtime) {
                LOG("Item Location path changed: " + lf.path + " Item ID: " + 
                    id + " Location Key: " + location.name + ", attempting to upgrade item...");
                if (canUse(id, location)) {
                  installItem(id, location, 
                              function(installManifest, id, location, type) {
                                em._upgradeItem(installManifest, id, location, 
                                                type);
                              });
                  isDirty = true;
                }
              }
            }
            else {
              isDirty = true;
              LOG("Install Location returned a missing or malformed item path! " + 
                  "Item Path: " + lf.path + ", Location Key: " + location.name + 
                  " Item ID: " + id);
              if (canUse(id, location)) {
                // Load the Extensions Datasource and force this item into the visible
                // items list if it is not already. This allows us to handle the case 
                // where there is an entry for an item in the Startup Cache but not
                // in the extensions.rdf file - in that case the item will not be in
                // the visible list and calls to |getInstallLocation| will mysteriously
                // fail.
                this.datasource.updateVisibleList(id, location.name, false);
                this.uninstallItem(id);
              }
            }
          }
        }
      }

      // Look for items that have been installed by appearing in the location.
      for (var id in actualItems) {
        if (!(location.name in StartupCache.entries) || 
            !(id in StartupCache.entries[location.name]) ||
            !StartupCache.entries[location.name][id]) {
          // Remember that we've seen this item
          StartupCache.put(location, id, OP_NONE, true);
          // Push it on the stack of items to maybe install later
          newItems.push({location: location, id: id});
        }
      }
    }

    // Process any newly discovered items.  We do this here instead of in the
    // previous loop so that we can be sure that we have a fully populated
    // StartupCache.
    for (var i = 0; i < newItems.length; ++i) {
      var id = newItems[i].id;
      var location = newItems[i].location;
      if (canUse(id, location)) {
        LOG("Item Installed via directory addition to Install Location: " + 
            location.name + " Item ID: " + id + ", attempting to register...");
        installItem(id, location, 
                    function(installManifest, id, location, type) { 
                      em._configureForthcomingItem(installManifest, id, location, 
                                                   type);
                    });
        // Disable add-ons on install when the InstallDisabled file exists.
        // This is so Talkback will be disabled on a subset of installs.
        var installDisabled = location.getItemFile(id, "InstallDisabled");
        if (installDisabled.exists())
          em.disableItem(id);
        isDirty = true;
      }
    }

    // Ask the user if they want to install the dropped items, for security
    // purposes.
    installDroppedInFiles(droppedInFiles, xpinstallStrings);
    
    return isDirty;
  },
  
  /**
   * Upgrades contents.rdf files to chrome.manifest files for any existing
   * Extensions and Themes.
   * @returns true if actions were performed that require a restart, false 
   *          otherwise.
   */
  _upgradeChrome: function() {
    if (inSafeMode())
      return false;

    var checkForNewChrome = false;
    var ds = this.datasource;
    // If we have extensions that were installed before the new flat chrome
    // manifests, and are still valid, we need to manually create the flat
    // manifest files.
    var extensions = this._getActiveItems(nsIUpdateItem.TYPE_EXTENSION +
                                          nsIUpdateItem.TYPE_LOCALE +
                                          nsIUpdateItem.TYPE_PLUGIN);
    for (var i = 0; i < extensions.length; ++i) {
      var e = extensions[i];
      var itemLocation = e.location.getItemLocation(e.id);
      var manifest = itemLocation.clone();
      manifest.append(FILE_CHROME_MANIFEST);
      if (!manifest.exists()) {
        var installRDF = itemLocation.clone();
        installRDF.append(FILE_INSTALL_MANIFEST);
        var installLocation = this.getInstallLocation(e.id);
        if (installLocation && installRDF.exists()) {
          var itemLocation = installLocation.getItemLocation(e.id);
          if (itemLocation.exists() && itemLocation.isDirectory()) {
            var installer = new Installer(ds, e.id, installLocation, 
                                          nsIUpdateItem.TYPE_EXTENSION);
            installer.upgradeExtensionChrome();
          }
        }
        else {
          ds.removeItemMetadata(e.id);
          ds.removeItemFromContainer(e.id);
        }

        checkForNewChrome = true;
      }
    }

    var themes = this._getActiveItems(nsIUpdateItem.TYPE_THEME);
    // If we have themes that were installed before the new flat chrome
    // manifests, and are still valid, we need to manually create the flat
    // manifest files.
    for (i = 0; i < themes.length; ++i) {
      var item = themes[i];
      var itemLocation = item.location.getItemLocation(item.id);
      var manifest = itemLocation.clone();
      manifest.append(FILE_CHROME_MANIFEST);
      if (manifest.exists() ||
          item.id == stripPrefix(RDFURI_DEFAULT_THEME, PREFIX_ITEM_URI))
        continue;

      var entries;
      try {
        var manifestURI = getURIFromFile(manifest);
        var chromeDir = itemLocation.clone();
        chromeDir.append(DIR_CHROME);
        
        if (!chromeDir.exists() || !chromeDir.isDirectory()) {
          ds.removeItemMetadata(item.id);
          ds.removeItemFromContainer(item.id);
          continue;
        }

        // We're relying on the fact that there is only one JAR file
        // in the "chrome" directory. This is a hack, but it works.
        entries = chromeDir.directoryEntries.QueryInterface(nsIDirectoryEnumerator);
        var jarFile = entries.nextFile;
        if (jarFile) {
          var jarFileURI = getURIFromFile(jarFile);
          var contentsURI = newURI("jar:" + jarFileURI.spec + "!/");

          // Use the Chrome Registry API to install the theme there
          var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                            .getService(Components.interfaces.nsIToolkitChromeRegistry);
          cr.processContentsManifest(contentsURI, manifestURI, contentsURI, false, true);
        }
        entries.close();
      }
      catch (e) {
        LOG("_upgradeChrome: failed to upgrade contents manifest for " + 
            "theme: " + item.id + ", exception: " + e + "... The theme will be " + 
            "disabled.");
        this._appDisableItem(item.id);
      }
      finally {
        try {
          entries.close();
        }
        catch (e) {
        }
      }
      checkForNewChrome = true;
    }
    return checkForNewChrome;  
  },
  
  _checkForUncoveredItem: function(id) {
    var ds = this.datasource;
    var oldLocation = this.getInstallLocation(id);
    var newLocations = [];
    for (var locationKey in StartupCache.entries) {
      var location = InstallLocations.get(locationKey);
      if (id in StartupCache.entries[locationKey] && 
          location.priority > oldLocation.priority)
        newLocations.push(location);
    }
    newLocations.sort(function(a, b) { return b.priority - a.priority; });
    if (newLocations.length > 0) {
      for (var i = 0; i < newLocations.length; ++i) {
        // Check to see that the item at the location exists
        var installRDF = newLocations[i].getItemFile(id, FILE_INSTALL_MANIFEST);
        if (installRDF.exists()) {
          // Update the visible item cache so that |_finalizeUpgrade| is properly 
          // called from |_finishOperations|
          var name = newLocations[i].name;
          ds.updateVisibleList(id, name, true);
          PendingOperations.addItem(OP_NEEDS_UPGRADE, 
                                    { locationKey: name, id: id });
          PendingOperations.addItem(OP_NEEDS_INSTALL, 
                                    { locationKey: name, id: id });
          break;
        }
        else {
          // If no item exists at the location specified, remove this item
          // from the visible items list and check again. 
          StartupCache.clearEntry(newLocations[i], id);
          ds.updateVisibleList(id, null, true);
        }
      }
    }
    else
      ds.updateVisibleList(id, null, true);
  },
  
  /**
   * Finish up pending operations - perform upgrades, installs, enables/disables, 
   * uninstalls etc.
   * @returns true if actions were performed that require a restart, false 
   *          otherwise.
   */
  _finishOperations: function() {
    try {
      // Stuff has changed, load the Extensions datasource in all its RDFey
      // glory. 
      var ds = this.datasource;
      var updatedTargetAppInfos = [];

      var needsRestart = false;      
      do {
        // Enable and disable during startup so items that are changed in the
        // ui can be reset to a no-op.
        // Look for extensions that need to be enabled.
        var items = PendingOperations.getOperations(OP_NEEDS_ENABLE);
        for (var i = items.length - 1; i >= 0; --i) {
          var id = items[i].id;
          var installLocation = this.getInstallLocation(id);
          StartupCache.put(installLocation, id, OP_NONE, true);
          PendingOperations.clearItem(OP_NEEDS_ENABLE, id);
          needsRestart = true;
        }
        PendingOperations.clearItems(OP_NEEDS_ENABLE);

        // Look for extensions that need to be disabled.
        items = PendingOperations.getOperations(OP_NEEDS_DISABLE);
        for (i = items.length - 1; i >= 0; --i) {
          id = items[i].id;
          installLocation = this.getInstallLocation(id);
          StartupCache.put(installLocation, id, OP_NONE, true);
          PendingOperations.clearItem(OP_NEEDS_DISABLE, id);
          needsRestart = true;
        }
        PendingOperations.clearItems(OP_NEEDS_DISABLE);

        // Look for extensions that need to be upgraded. The process here is to
        // uninstall the old version of the extension first, then install the
        // new version in its place. 
        items = PendingOperations.getOperations(OP_NEEDS_UPGRADE);
        for (i = items.length - 1; i >= 0; --i) {
          id = items[i].id;
          var newLocation = InstallLocations.get(items[i].locationKey);
          // check if there is updated app compatibility info
          var newTargetAppInfo = ds.getUpdatedTargetAppInfo(id);
          if (newTargetAppInfo)
            updatedTargetAppInfos.push(newTargetAppInfo);
          this._finalizeUpgrade(id, newLocation);
        }
        PendingOperations.clearItems(OP_NEEDS_UPGRADE);

        // Install items
        items = PendingOperations.getOperations(OP_NEEDS_INSTALL);
        for (i = items.length - 1; i >= 0; --i) {
          needsRestart = true;
          id = items[i].id;
          // check if there is updated app compatibility info
          newTargetAppInfo = ds.getUpdatedTargetAppInfo(id);
          if (newTargetAppInfo)
            updatedTargetAppInfos.push(newTargetAppInfo);
          this._finalizeInstall(id, null);
        }
        PendingOperations.clearItems(OP_NEEDS_INSTALL);

        // Look for extensions that need to be removed. This MUST be done after
        // the install operations since extensions to be installed may have to be
        // uninstalled if there are errors during the installation process!
        items = PendingOperations.getOperations(OP_NEEDS_UNINSTALL);
        for (i = items.length - 1; i >= 0; --i) {
          id = items[i].id;
          this._finalizeUninstall(id);
          this._checkForUncoveredItem(id);
          needsRestart = true;
        }
        PendingOperations.clearItems(OP_NEEDS_UNINSTALL);

        // When there have been operations and all operations have completed.
        if (PendingOperations.size == 0) {
          // If there is updated app compatibility info update the data sources.
          for (i = 0; i < updatedTargetAppInfos.length; ++i)
            ds.updateTargetAppInfo(updatedTargetAppInfos[i].id,
                                   updatedTargetAppInfos[i].minVersion,
                                   updatedTargetAppInfos[i].maxVersion);

          // Enumerate all items
          var ctr = getContainer(ds, ds._itemRoot);
          var elements = ctr.GetElements();
          while (elements.hasMoreElements()) {
            var itemResource = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);

            // Ensure appDisabled is in the correct state.
            id = stripPrefix(itemResource.Value, PREFIX_ITEM_URI);
            if (this._isUsableItem(id))
              ds.setItemProperty(id, EM_R("appDisabled"), null);
            else
              ds.setItemProperty(id, EM_R("appDisabled"), EM_L("true"));

            // userDisabled is set based on its value being OP_NEEDS_ENABLE or
            // OP_NEEDS_DISABLE. This allows us to have an item to be enabled
            // by the app and disabled by the user during a single restart.
            var value = stringData(ds.GetTarget(itemResource, EM_R("userDisabled"), true));
            if (value == OP_NEEDS_ENABLE)
              ds.setItemProperty(id, EM_R("userDisabled"), null);
            else if (value == OP_NEEDS_DISABLE)
              ds.setItemProperty(id, EM_R("userDisabled"), EM_L("true"));
          }
        }
      }
      while (PendingOperations.size > 0);
      
      // Upgrade contents.rdf files to the new chrome.manifest format for
      // existing Extensions and Themes
      if (this._upgradeChrome()) {
        var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                           .getService(Components.interfaces.nsIChromeRegistry);
        cr.checkForNewChrome();
      }

      // If no additional restart is required, it implies that there are
      // no new components that need registering so we can inform the app
      // not to do any extra startup checking next time round. 
      this._updateManifests(needsRestart);

    }
    catch (e) {
      LOG("ExtensionManager:_finishOperations - failure, catching exception - lineno: " +
          e.lineNumber + " - file: " + e.fileName + " - " + e);
    }
    return needsRestart;
  },
  
  /**
   * Checks to see if there are items that are incompatible with this version
   * of the application, disables them to prevent incompatibility problems and 
   * invokes the Update Wizard to look for newer versions.
   * @returns true if there were incompatible items installed and disabled, and
   *          the application must now be restarted to reinitialize XPCOM,
   *          false otherwise.
   */
  checkForMismatches: function() {
    // Check to see if the version of the application that is being started
    // now is the same one that was started last time. 
    var currAppVersion = gApp.version;
    var lastAppVersion = getPref("getCharPref", PREF_EM_LAST_APP_VERSION, "");
    if (currAppVersion == lastAppVersion)
      return false;
    // With a new profile lastAppVersion doesn't exist yet.
    if (!lastAppVersion) {
      gPref.setCharPref(PREF_EM_LAST_APP_VERSION, currAppVersion);
      return false;
    }

    // Version mismatch, we have to load the extensions datasource and do
    // version checking. Time hit here doesn't matter since this doesn't happen
    // all that often.
    this._upgradeFromV10();
    
    // Make the extensions datasource consistent if it isn't already.
    var isDirty = false;
    if (this._ensureDatasetIntegrity())
      isDirty = true;

    if (this._checkForFileChanges())
      isDirty = true;

    if (PendingOperations.size != 0)
      isDirty = true;

    if (isDirty)
      this._finishOperations();

    var ds = this.datasource;
    // During app upgrade cleanup invalid entries in the extensions datasource.
    ds.beginUpdateBatch();
    var allResources = ds.GetAllResources();
    while (allResources.hasMoreElements()) {
      var res = allResources.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      if (ds.GetTarget(res, EM_R("downloadURL"), true) ||
          (!ds.GetTarget(res, EM_R("installLocation"), true) &&
          stringData(ds.GetTarget(res, EM_R("appDisabled"), true)) == "true"))
        ds.removeDownload(res.Value);
    }
    ds.endUpdateBatch();

    var allAppManaged = true;
    var ctr = getContainer(ds, ds._itemRoot);
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var itemResource = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = stripPrefix(itemResource.Value, PREFIX_ITEM_URI);
      if (ds.getItemProperty(id, "appManaged") == "true") {
        // Force an update of the metadata for appManaged extensions since the
        // last modified time is not updated for directories on FAT / FAT32
        // filesystems when software update applies a new version of the app.
        var location = this.getInstallLocation(id);
        if (location.name == KEY_APP_GLOBAL) {
          var installRDF = location.getItemFile(id, FILE_INSTALL_MANIFEST);
          if (installRDF.exists()) {
            var metadataDS = getInstallManifest(installRDF);
            ds.addItemMetadata(id, metadataDS, location);
            ds.updateProperty(id, "compatible");
          }
        }
      }
      else if (allAppManaged)
        allAppManaged = false;
      // appDisabled is determined by an item being compatible,
      // satisfying its dependencies, and not being blocklisted
      if (this._isUsableItem(id)) {
        if (ds.getItemProperty(id, "appDisabled"))
          ds.setItemProperty(id, EM_R("appDisabled"), null);
      }
      else if (!ds.getItemProperty(id, "appDisabled"))
        ds.setItemProperty(id, EM_R("appDisabled"), EM_L("true"));

      ds.setItemProperty(id, EM_R("availableUpdateURL"), null);
      ds.setItemProperty(id, EM_R("availableUpdateVersion"), null);
    }
    // Update the manifests to reflect the items that were disabled / enabled.
    this._updateManifests(true);

    // Always check for compatibility updates when upgrading if we have add-ons
    // that aren't managed by the application.
    if (!allAppManaged)
      this._showMismatchWindow();
    
    // Finish any pending upgrades from the compatibility update to avoid an
    // additional restart.
    if (PendingOperations.size != 0)
      this._finishOperations();

    // Update the last app version so we don't do this again with this version.
    gPref.setCharPref(PREF_EM_LAST_APP_VERSION, currAppVersion);

    // Prevent extension update dialog from showing
    gPref.setBoolPref(PREF_UPDATE_NOTIFYUSER, false);
    return true;
  },

  /**
   * Shows the "Compatibility Updates" UI
   */
  _showMismatchWindow: function(items) {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var wizard = wm.getMostRecentWindow("Update:Wizard");
    if (wizard)
      wizard.focus();
    else {
      var features = "chrome,centerscreen,dialog,titlebar,modal";
      // This *must* be modal so as not to break startup! This code is invoked before
      // the main event loop is initiated (via checkForMismatches).
      var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(Components.interfaces.nsIWindowWatcher);
      ww.openWindow(null, URI_EXTENSION_UPDATE_DIALOG, "", features, null);
    }
  },
  
  /*
   * Catch all for facilitating a version 1.0 profile upgrade.
   * 1) removes the abandoned default theme directory from the profile.
   * 2) prepares themes installed with version 1.0 for installation.
   * 3) initiates an install to populate the new extensions datasource.
   * 4) migrates the disabled attribute from the old datasource.
   * 5) migrates the app compatibility info from the old datasource.
   */
  _upgradeFromV10: function() {
    var extensionsDS = getFile(KEY_PROFILEDIR, [FILE_EXTENSIONS]);
    var dsExists = extensionsDS.exists();
    // Toolkiit 1.7 profiles (Firefox 1.0, Thunderbird 1.0, etc.) have a default
    // theme directory in the profile's extensions directory that will be
    // disabled due to having a maxVersion that is incompatible with the
    // toolkit 1.8 release of the app.
    var profileDefaultTheme = getDirNoCreate(KEY_PROFILEDS, [DIR_EXTENSIONS,
                                             stripPrefix(RDFURI_DEFAULT_THEME, PREFIX_ITEM_URI)]);
    if (profileDefaultTheme && profileDefaultTheme.exists()) {
      removeDirRecursive(profileDefaultTheme);
      // Sunbird 0.3a1 didn't move the default theme into the app's extensions
      // directory and we can't install it while uninstalling the one in the
      // profile directory. If we have a toolkit 1.8 extensions datasource and
      // a profile default theme deleting the toolkit 1.8 extensions datasource
      // will fix this problem when the datasource is re-created.
      if (dsExists)
        extensionsDS.remove(false);
    }

    // return early if the toolkit 1.7 extensions datasource file doesn't exist.
    var oldExtensionsFile = getFile(KEY_PROFILEDIR, [DIR_EXTENSIONS, "Extensions.rdf"]);
    if (!oldExtensionsFile.exists())
      return;

    // Sunbird 0.2 used a different GUID for the default theme
    profileDefaultTheme = getDirNoCreate(KEY_PROFILEDS, [DIR_EXTENSIONS,
                                         "{8af2d0a7-e394-4de2-ae55-2dae532a7a9b}"]);
    if (profileDefaultTheme && profileDefaultTheme.exists())
      removeDirRecursive(profileDefaultTheme);

    // Firefox 0.9 profiles may have DOMi 1.0 with just an install.rdf
    var profileDOMi = getDirNoCreate(KEY_PROFILEDS, [DIR_EXTENSIONS,
                                     "{641d8d09-7dda-4850-8228-ac0ab65e2ac9}"]);
    if (profileDOMi && profileDOMi.exists())
      removeDirRecursive(profileDOMi);

    // return early to avoid migrating data twice if we already have a
    // toolkit 1.8 extension datasource.
    if (dsExists)
      return;

    // Prepare themes for installation
    // Only enumerate directories in the app-profile and app-global locations.
    var locations = [KEY_APP_PROFILE, KEY_APP_GLOBAL];
    for (var i = 0; i < locations.length; ++i) {
      var location = InstallLocations.get(locations[i]);
      if (!location.canAccess)
        continue;

      var entries = location.itemLocations;
      var entry;
      while ((entry = entries.nextFile)) {
        var installRDF = entry.clone();
        installRDF.append(FILE_INSTALL_MANIFEST);

        var chromeDir = entry.clone();
        chromeDir.append(DIR_CHROME);

        // It must be a directory without an install.rdf and it must contain
        // a chrome directory
        if (!entry.isDirectory() || installRDF.exists() || !chromeDir.exists())
          continue;

        var chromeEntries = chromeDir.directoryEntries.QueryInterface(nsIDirectoryEnumerator);
        if (!chromeEntries.hasMoreElements())
          continue;

        // We're relying on the fact that there is only one JAR file
        // in the "chrome" directory. This is a hack, but it works.
        var jarFile = chromeEntries.nextFile;
        if (jarFile.isDirectory())
          continue;
        var id = location.getIDForLocation(entry);

        try {
          var zipReader = getZipReaderForFile(jarFile);
          zipReader.extract(FILE_INSTALL_MANIFEST, installRDF);

          var contentsManifestFile = location.getItemFile(id, FILE_CONTENTS_MANIFEST);
          zipReader.extract(FILE_CONTENTS_MANIFEST, contentsManifestFile);

          var rootFiles = ["preview.png", "icon.png"];
          for (var i = 0; i < rootFiles.length; ++i) {
            try {
              var target = location.getItemFile(id, rootFiles[i]);
              zipReader.extract(rootFiles[i], target);
            }
            catch (e) {
            }
          }
          zipReader.close();
        }
        catch (e) {
          LOG("ExtensionManager:_upgradeFromV10 - failed to extract theme files\r\n" +
              "Exception: " + e);
        }
      }
    }

    // When upgrading from a version 1.0 profile we need to populate the
    // extensions datasource with all items before checking for incompatible
    // items since the datasource hasn't been created yet.
    var itemsToCheck = [];
    if (this._checkForFileChanges()) {
      // Create a list of all items that are to be installed so we can migrate
      // these items's settings to the new datasource.
      var items = PendingOperations.getOperations(OP_NEEDS_INSTALL);
      for (i = items.length - 1; i >= 0; --i) {
        if (items[i].locationKey == KEY_APP_PROFILE ||
            items[i].locationKey == KEY_APP_GLOBAL)
          itemsToCheck.push(items[i].id);
      }
      this._finishOperations();
    }

    // If there are no items to migrate settings for return early.
    if (itemsToCheck.length == 0)
      return;

    var fileURL = getURLSpecFromFile(oldExtensionsFile);
    var oldExtensionsDS = gRDF.GetDataSourceBlocking(fileURL);
    var versionChecker = getVersionChecker();
    var ds = this.datasource;
    var currAppVersion = gApp.version;
    var currAppID = gApp.ID;
    for (var i = 0; i < itemsToCheck.length; ++i) {
      var item = ds.getItemForID(itemsToCheck[i]);
      var oldPrefix = (item.type == nsIUpdateItem.TYPE_EXTENSION) ? PREFIX_EXTENSION : PREFIX_THEME;
      var oldRes = gRDF.GetResource(oldPrefix + item.id);
      // Disable the item if it was disabled in the version 1.0 extensions
      // datasource.
      if (oldExtensionsDS.GetTarget(oldRes, EM_R("disabled"), true))
        ds.setItemProperty(item.id, EM_R("userDisabled"), EM_L("true"));

      // app enable all items. If it is incompatible it will be app disabled
      // later on.
      ds.setItemProperty(item.id, EM_R("appDisabled"), null);

      // if the item is already compatible don't attempt to migrate the
      // item's compatibility info
      var newRes = getResourceForID(itemsToCheck[i]);
      if (ds.isCompatible(ds, newRes))
        continue;

      var updatedMinVersion = null;
      var updatedMaxVersion = null;
      var targetApps = oldExtensionsDS.GetTargets(oldRes, EM_R("targetApplication"), true);
      while (targetApps.hasMoreElements()) {
        var targetApp = targetApps.getNext();
        if (targetApp instanceof Components.interfaces.nsIRDFResource) {
          try {
            var foundAppID = stringData(oldExtensionsDS.GetTarget(targetApp, EM_R("id"), true));
            if (foundAppID != currAppID) // Different target application
              continue;

            updatedMinVersion = stringData(oldExtensionsDS.GetTarget(targetApp, EM_R("minVersion"), true));
            updatedMaxVersion = stringData(oldExtensionsDS.GetTarget(targetApp, EM_R("maxVersion"), true));

            // Only set the target app info if the extension's target app info
            // in the version 1.0 extensions datasource makes it compatible
            if (versionChecker.compare(currAppVersion, updatedMinVersion) >= 0 &&
                versionChecker.compare(currAppVersion, updatedMaxVersion) <= 0)
              ds.updateTargetAppInfo(item.id, updatedMinVersion, updatedMaxVersion);

            break;
          }
          catch (e) { 
          }
        }
      }
    }
  },

  /**
   * Write the Extensions List and the Startup Cache
   * @param   needsRestart
   *          true if the application needs to restart again, false otherwise.
   */  
  _updateManifests: function(needsRestart) {
    // Write the Startup Cache (All Items, visible or not)
    StartupCache.write();
    // Write the Extensions Locations Manifest (Visible, enabled items)
    this._updateExtensionsManifest(needsRestart);
  },

  /**
   * Get a list of items that are currently "active" (turned on) of a specific
   * type
   * @param   type
   *          The nsIUpdateItem type to return a list of items of
   * @returns An array of active items of the specified type.
   */
  _getActiveItems: function(type) {
    var allItems = this.getItemList(type, { });
    var activeItems = [];
    var ds = this.datasource;
    for (var i = 0; i < allItems.length; ++i) {
      var item = allItems[i];

      // An item entry is valid only if it is not disabled, not about to 
      // be disabled, and not about to be uninstalled.
      var installLocation = this.getInstallLocation(item.id);
      if (installLocation.name in StartupCache.entries &&
          item.id in StartupCache.entries[installLocation.name] &&
          StartupCache.entries[installLocation.name][item.id]) {
        var op = StartupCache.entries[installLocation.name][item.id].op;
        if (op == OP_NEEDS_INSTALL || op == OP_NEEDS_UPGRADE || 
            op == OP_NEEDS_UNINSTALL || op == OP_NEEDS_DISABLE)
          continue;
      }
      // Suppress items that have been disabled by the user or the app.
      if (ds.getItemProperty(item.id, "isDisabled") != "true")
        activeItems.push({ id: item.id, location: installLocation });
    }

    return activeItems;
  },
  
  /**
   * Write the Extensions List
   * @param   needsRestart
   *          true if the application needs to restart again, false otherwise.
   */
  _updateExtensionsManifest: function(needsRestart) {
    // When an operation is performed that requires a component re-registration
    // (extension enabled/disabled, installed, uninstalled), we must write the
    // set of paths where extensions live so that the startup system can determine
    // where additional components, preferences, chrome manifests etc live.
    //
    // To do this we obtain a list of active extensions and themes and write 
    // these to the extensions.ini file in the profile directory.
    var validExtensions = this._getActiveItems(nsIUpdateItem.TYPE_EXTENSION +
                                               nsIUpdateItem.TYPE_LOCALE +
                                               nsIUpdateItem.TYPE_PLUGIN);
    var validThemes     = this._getActiveItems(nsIUpdateItem.TYPE_THEME);

    var extensionsLocationsFile = getFile(KEY_PROFILEDIR, [FILE_EXTENSION_MANIFEST]);
    var fos = openSafeFileOutputStream(extensionsLocationsFile);
        
    var extensionSectionHeader = "[ExtensionDirs]\r\n";
    fos.write(extensionSectionHeader, extensionSectionHeader.length);
    for (var i = 0; i < validExtensions.length; ++i) {
      var e = validExtensions[i];
      var itemLocation = e.location.getItemLocation(e.id).QueryInterface(nsILocalFile);
      var descriptor = getAbsoluteDescriptor(itemLocation);
      var line = "Extension" + i + "=" + descriptor + "\r\n";
      fos.write(line, line.length);
    }

    var themeSectionHeader = "[ThemeDirs]\r\n";
    fos.write(themeSectionHeader, themeSectionHeader.length);
    for (i = 0; i < validThemes.length; ++i) {
      var e = validThemes[i];
      var itemLocation = e.location.getItemLocation(e.id).QueryInterface(nsILocalFile);
      var descriptor = getAbsoluteDescriptor(itemLocation);
      var line = "Extension" + i + "=" + descriptor + "\r\n";
      fos.write(line, line.length);
    }

    closeSafeFileOutputStream(fos);

    // Now refresh the compatibility manifest.
    this._extensionListChanged = needsRestart;
  },
  
  /**
   * Say whether or not the Extension List has changed (and thus whether or not
   * the system will have to restart the next time it is started).
   * @param   val
   *          true if the Extension List has changed, false otherwise.
   * @returns |val|
   */
  set _extensionListChanged(val) {
    // When an extension has an operation perform on it (e.g. install, upgrade,
    // disable, etc.) we are responsible for creating the .autoreg file and
    // nsAppRunner is responsible for removing it on restart. At some point it
    // may make sense to be able to cancel a registration but for now we only
    // create the file.
    try {
      var autoregFile = getFile(KEY_PROFILEDIR, [FILE_AUTOREG]);
      if (val && !autoregFile.exists())
        autoregFile.create(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
    }
    catch (e) {
    }
    return val;
  },
  
  /**
   * Gathers data about an item specified by the supplied Install Manifest
   * and determines whether or not it can be installed as-is. It makes this 
   * determination by validating the item's GUID, Version, and determining 
   * if it is compatible with this application.
   * @param   installManifest 
   *          A nsIRDFDataSource representing the Install Manifest of the 
   *          item to be installed.
   * @return  A JS Object with the following properties:
   *          "id"       The GUID of the Item being installed.
   *          "version"  The Version string of the Item being installed.
   *          "name"     The Name of the Item being installed.
   *          "type"     The nsIUpdateItem type of the Item being installed.
   *          "targetApps" An array of TargetApplication Info Objects
   *                     with "id", "minVersion" and "maxVersion" properties,
   *                     representing applications targeted by this item.
   *          "error"    The result code:
   *                     INSTALLERROR_SUCCESS      
   *                       no error, item can be installed
   *                     INSTALLERROR_INVALID_GUID 
   *                       error, GUID is not well-formed
   *                     INSTALLERROR_INVALID_VERSION
   *                       error, Version is not well-formed
   *                     INSTALLERROR_INCOMPATIBLE_VERSION
   *                       error, item is not compatible with this version
   *                       of the application.
   *                     INSTALLERROR_INCOMPATIBLE_PLATFORM
   *                       error, item is not compatible with the operating
   *                       system or ABI the application was built for.
   *                     INSTALLERROR_BLOCKLISTED
   *                       error, item is blocklisted
   */
  _getInstallData: function(installManifest) {
    var installData = { id          : "", 
                        version     : "", 
                        name        : "", 
                        type        : 0, 
                        error       : INSTALLERROR_SUCCESS, 
                        targetApps  : [],
                        currentApp  : null };

    // Fetch properties from the Install Manifest
    installData.id       = getManifestProperty(installManifest, "id");
    installData.version  = getManifestProperty(installManifest, "version");
    installData.name     = getManifestProperty(installManifest, "name");
    installData.type     = getAddonTypeFromInstallManifest(installManifest);
    installData.updateURL= getManifestProperty(installManifest, "updateURL");

    /**
     * Reads a property off a Target Application resource
     * @param   resource
     *          The RDF Resource for a Target Application
     * @param   property
     *          The property (less EM_NS) to read
     * @returns The string literal value of the property.
     */
    function readTAProperty(resource, property) {
      return stringData(installManifest.GetTarget(resource, EM_R(property), true));
    }
    
    var targetApps = installManifest.GetTargets(gInstallManifestRoot, 
                                                EM_R("targetApplication"), 
                                                true);
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext();
      if (targetApp instanceof Components.interfaces.nsIRDFResource) {
        try {
          var data = { id        : readTAProperty(targetApp, "id"),
                       minVersion: readTAProperty(targetApp, "minVersion"),
                       maxVersion: readTAProperty(targetApp, "maxVersion") };
          installData.targetApps.push(data);
          if (data.id == gApp.ID) 
            installData.currentApp = data;
        }
        catch (e) {
          continue;
        }
      }
    }

    // If the item specifies one or more target platforms, make sure our OS/ABI
    // combination is in the list - otherwise, refuse to install the item.
    var targetPlatforms = null;
    try {
      targetPlatforms = installManifest.GetTargets(gInstallManifestRoot, 
                                                   EM_R("targetPlatform"), 
                                                   true);
    } catch(e) {
      // No targetPlatform nodes, continue.
    }
    if (targetPlatforms != null && targetPlatforms.hasMoreElements()) {
      var foundMatchingOS = false;
      var foundMatchingOSAndABI = false;
      var requireABICompatibility = false;
      while (targetPlatforms.hasMoreElements()) {
        var targetPlatform = stringData(targetPlatforms.getNext());
        var os = targetPlatform.split("_")[0];
        var index = targetPlatform.indexOf("_");
        var abi = index != -1 ? targetPlatform.substr(index + 1) : null;
        if (os == gOSTarget) {
          foundMatchingOS = true;
          // The presence of any ABI part after our OS means ABI is important.
          if (abi != null) {
            requireABICompatibility = true;
            // If we don't know our ABI, we can't be compatible
            if (abi == gXPCOMABI && abi != UNKNOWN_XPCOM_ABI) {
              foundMatchingOSAndABI = true;
              break;
            }
          }
        }
      }
      if (!foundMatchingOS || (requireABICompatibility && !foundMatchingOSAndABI)) {
        installData.error = INSTALLERROR_INCOMPATIBLE_PLATFORM;
        return installData;
      }
    }

    // Validate the Item ID
    if (!gIDTest.test(installData.id)) {
      installData.error = INSTALLERROR_INVALID_GUID;
      return installData;
    }
     
    // Check the target application range specified by the extension metadata.
    if (gCheckCompatibility &&
        !this.datasource.isCompatible(installManifest, gInstallManifestRoot, undefined))
      installData.error = INSTALLERROR_INCOMPATIBLE_VERSION;
    
    // Check if the item is blocklisted.
    if (this.datasource.isBlocklisted(installData.id, installData.version,
                                      undefined, undefined))
      installData.error = INSTALLERROR_BLOCKLISTED;

    return installData;
  },  
  
  /**
   * Installs an item from a XPI/JAR file. 
   * This is the main entry point into the Install system from outside code
   * (e.g. XPInstall).
   * @param   aXPIFile
   *          The file to install from.
   * @param   aInstallLocationKey
   *          The name of the Install Location where this item should be 
   *          installed.
   */  
  installItemFromFile: function(xpiFile, installLocationKey) {
    this.installItemFromFileInternal(xpiFile, installLocationKey, null);
  },
  
  /**
   * Installs an item from a XPI/JAR file.
   * @param   aXPIFile
   *          The file to install from.
   * @param   aInstallLocationKey
   *          The name of the Install Location where this item should be 
   *          installed.
   * @param   aInstallManifest
   *          An updated Install Manifest from the Version Update check.
   *          Can be null when invoked from callers other than the Version
   *          Update check.
   */
  installItemFromFileInternal: function(aXPIFile, aInstallLocationKey, aInstallManifest) {
    var em = this;
    /**
     * Gets the Install Location for an Item.
     * @param   itemID 
     *          The GUID of the item to find an Install Location for.
     * @return  An object implementing nsIInstallLocation which represents the 
     *          location where the specified item should be installed. 
     *          This can be:
     *          1. an object that corresponds to the location key supplied to
     *             |installItemFromFileInternal|,
     *          2. the default install location (the App Profile Extensions Folder)
     *             if no location key was supplied, or the location key supplied
     *             was not in the set of registered locations
     *          3. null, if the location selected by 1 or 2 above does not support
     *             installs from XPI/JAR files, or that location is not writable 
     *             with the current access privileges.
     */
    function getInstallLocation(itemID) {
      // Here I use "upgrade" to mean "install a different version of an item".
      var installLocation = em.getInstallLocation(itemID);
      if (!installLocation) {
        // This is not an "upgrade", since we don't have any location data for the
        // extension ID specified - that is, it's not in our database.

        // Caller supplied a key to a registered location, use that location
        // for the installation
        installLocation = InstallLocations.get(aInstallLocationKey);
        if (installLocation) {
          // If the specified location does not have a common metadata location
          // (e.g. extensions have no common root, or other location specified
          // by the location implementation) - e.g. for a Registry Key enumeration
          // location - we cannot install or upgrade using a XPI file, probably
          // because these application types will be handling upgrading themselves.
          // Just bail.
          if (!installLocation.location) {
            LOG("Install Location \"" + installLocation.name + "\" does not support " + 
                "installation of items from XPI/JAR files. You must manage " + 
                "installation and update of these items yourself.");
            installLocation = null;
          }
        }
        else {
          // In the absence of a preferred install location, just default to
          // the App-Profile 
          installLocation = InstallLocations.get(KEY_APP_PROFILE);
        }
      } 
      else {
        // This is an "upgrade", but not through the Update System, because the
        // Update code will not let an extension with an incompatible target
        // app version range through to this point. This is an "upgrade" in the
        // sense that the user found a different version of an installed extension
        // and installed it through the web interface, so we have metadata.
        
        // If the location is different, return the preferred location rather than
        // the location of the currently installed version, because we may be in
        // the situation where an item is being installed into the global app 
        // dir when there's a version in the profile dir.
        if (installLocation.name != aInstallLocationKey) 
          installLocation = InstallLocations.get(aInstallLocationKey);
      }
      if (!installLocation.canAccess) {
        LOG("Install Location\"" + installLocation.name + "\" cannot be written " +
            "to with your access privileges. Installation will not proceed.");
        installLocation = null;
      }
      return installLocation;
    }
    
    /**
     * Stages a XPI file in the default item location specified by other 
     * applications when they registered with XulRunner if the item's
     * install manifest specified compatibility with them.
     */
    function stageXPIForOtherApps(xpiFile, installData) {
      for (var i = 0; i < installData.targetApps.length; ++i) {
        var targetApp = installData.targetApps[i];
        if (targetApp.id != gApp.ID) {
        /* XXXben uncomment when this works!
          var settingsThingy = Components.classes[]
                                        .getService(Components.interfaces.nsIXULRunnerSettingsThingy);
          try {
            var appPrefix = "SOFTWARE\\Mozilla\\XULRunner\\Applications\\";
            var branch = settingsThingy.getBranch(appPrefix + targetApp.id);
            var path = branch.getProperty("ExtensionsLocation");
            var destination = Components.classes["@mozilla.org/file/local;1"]
                                        .createInstance(nsILocalFile);
            destination.initWithPath(path);
            xpiFile.copyTo(file, xpiFile.leafName);
          }
          catch (e) {
          }
         */
        } 
      }        
    }
    
    /**
     * Extracts and then starts the install for extensions / themes contained
     * within a xpi.
     */
    function installMultiXPI(xpiFile, installData) {
      var fileURL = getURIFromFile(xpiFile).QueryInterface(nsIURL);
      if (fileURL.fileExtension.toLowerCase() != "xpi") {
        LOG("Invalid File Extension: Item: \"" + fileURL.fileName + "\" has an " + 
            "invalid file extension. Only xpi file extensions are allowed for " +
            "multiple item packages.");
        var bundle = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
        showMessage("invalidFileExtTitle", [], 
                    "invalidFileExtMessage", [installData.name,
                    fileURL.fileExtension,
                    bundle.GetStringFromName("type-" + installData.type)]);
        return;
      }

      try {
        var zipReader = getZipReaderForFile(xpiFile);
      }
      catch (e) {
        LOG("installMultiXPI: failed to open xpi file: " + xpiFile.path);
        throw e;
      }

      var searchForEntries = ["*.xpi", "*.jar"];
      var files = [];
      for (var i = 0; i < searchForEntries.length; ++i) {
        var entries = zipReader.findEntries(searchForEntries[i]);
        while (entries.hasMoreElements()) {
          var entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
          var target = getFile(KEY_TEMPDIR, [entry.name]);
          try {
            target.createUnique(nsILocalFile.NORMAL_FILE_TYPE, PERMS_FILE);
          }
          catch (e) {
            LOG("installMultiXPI: failed to create target file for extraction " +
                " file = " + target.path + ", exception = " + e + "\n");
          }
          zipReader.extract(entry.name, target);
          files.push(target);
        }
      }
      zipReader.close();

      if (files.length == 0) {
        LOG("Multiple Item Package: Item: \"" + fileURL.fileName + "\" does " +
            "not contain a valid package to install.");
        var bundle = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
        showMessage("missingPackageFilesTitle",
                    [bundle.GetStringFromName("type-" + installData.type)],
                    "missingPackageFilesMessage", [installData.name,
                    bundle.GetStringFromName("type-" + installData.type)]);
        return;
      }

      for (i = 0; i < files.length; ++i) {
        em.installItemFromFileInternal(files[i], aInstallLocationKey, null);
        files[i].remove(false);
      }
    }

    /**
     * An observer for the Extension Update System.
     * @constructor
     */
    function IncompatibleObserver() {}
    IncompatibleObserver.prototype = {
      _id: null,
      _type: nsIUpdateItem.TYPE_ANY,
      _xpi: null,
      _installManifest: null,
      _installRDF: null,
      
      /** 
       * Ask the Extension Update System if there are any version updates for
       * this item that will allow it to be compatible with this version of 
       * the Application.
       * @param   installManifest 
       *          The Install Manifest datasource for the item.
       * @param   installData
       *          The Install Data object for the item.
       * @param   xpiFile         
       *          The staged source XPI file that contains the item. Cleaned 
       *          up by this process.
       */
      checkForUpdates: function(installManifest, installData, xpiFile, installRDF) {
        this._id              = installData.id;
        this._type            = installData.type;
        this._xpi             = xpiFile;
        this._installManifest = installManifest;
        this._installRDF      = installRDF;
        
        var item = makeItem(installData.id, installData.version, 
                            aInstallLocationKey, 
                            installData.currentApp.minVersion, 
                            installData.currentApp.maxVersion,
                            installData.name,
                            "", /* XPI Update URL */
                            "", /* XPI Update Hash */
                            "", /* Icon URL */
                            installData.updateURL || "", 
                            installData.type);
        em.update([item], 1, true, this);
      },
      
      /**
       * See nsIExtensionManager.idl
       */
      onUpdateStarted: function() {
        LOG("Phone Home Listener: Update Started");
        em.datasource.onUpdateStarted();
      },
      
      /**
       * See nsIExtensionManager.idl
       */
      onUpdateEnded: function() {
        LOG("Phone Home Listener: Update Ended");
        // We are responsible for cleaning up this file!
        this._installRDF.remove(false);
        em.datasource.onUpdateEnded();
      },
      
      /**
       * See nsIExtensionManager.idl
       */
      onAddonUpdateStarted: function(addon) {
        LOG("Phone Home Listener: Update For " + addon.id + " started");
        em.datasource.addIncompatibleUpdateItem(addon.name, this._xpi.path,
                                                addon.type, addon.version);
        em.datasource.onAddonUpdateStarted(addon);
      },
      
      /**
       * See nsIExtensionManager.idl
       */
      onAddonUpdateEnded: function(addon, status) {
        LOG("Phone Home Listener: Update For " + addon.id + " ended, status = " + status); 
        em.datasource.removeDownload(this._xpi.path);
        LOG("Version Check Phone Home Completed");
        // Only compatibility updates (e.g. STATUS_VERSIONINFO) are currently
        // supported
        if (status == nsIAddonUpdateCheckListener.STATUS_VERSIONINFO) {
          em.datasource.setTargetApplicationInfo(addon.id, 
                                                 addon.minAppVersion,
                                                 addon.maxAppVersion, 
                                                 this._installManifest);

          // Try and install again, but use the updated compatibility DB
          em.installItemFromFileInternal(this._xpi, aInstallLocationKey, 
                                         this._installManifest);

          // Add the updated compatibility info to the datasource if done
          if (StartupCache.entries[aInstallLocationKey][addon.id].op == OP_NONE) {
            em.datasource.updateTargetAppInfo(addon.id, addon.minAppVersion,
                                              addon.maxAppVersion);
          }
          else { // needs a restart
            // Add updatedMinVersion and updatedMaxVersion so it can be used
            // to update the data sources during the installation or upgrade.
            em.datasource.setUpdatedTargetAppInfo(addon.id, addon.minAppVersion,
                                                  addon.maxAppVersion);
          }
          // Prevent the datasource file from being lazily recreated after
          // it is deleted by calling Flush.
          this._installManifest.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
          this._installManifest.Flush();
        }
        else {
          em.datasource.removeDownload(this._xpi.path);
          showIncompatibleError(installData);
          // We are responsible for cleaning up this file!
          InstallLocations.get(aInstallLocationKey).removeFile(this._xpi);
        }
        em.datasource.onAddonUpdateEnded(addon, status);
      },

      /**
       * See nsISupports.idl
       */
      QueryInterface: function(iid) {
        if (!iid.equals(Components.interfaces.nsIAddonUpdateCheckListener) &&
            !iid.equals(Components.interfaces.nsISupports))
          throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
      }
    }

    var installManifestFile = extractRDFFileToTempDir(aXPIFile, FILE_INSTALL_MANIFEST, true);
    var shouldPhoneHomeIfNecessary = false;
    if (!aInstallManifest) {
      // If we were not called with an Install Manifest, we were called from 
      // some other path than the Phone Home system, so we do want to phone
      // home if the version is incompatible.
      shouldPhoneHomeIfNecessary = true;
      var installManifest = getInstallManifest(installManifestFile);
      if (!installManifest) {
        LOG("The Install Manifest supplied by this item is not well-formed. " + 
            "Installation will not proceed.");
        installManifestFile.remove(false);
        return;
      }
    }
    else
      installManifest = aInstallManifest;
    
    var installData = this._getInstallData(installManifest);
    switch (installData.error) {
    case INSTALLERROR_INCOMPATIBLE_VERSION:
      // Since the caller cleans up |aXPIFile|, and we're not yet sure whether or
      // not we need it (we may need it if a remote version bump that makes it 
      // compatible is discovered by the call home) - so we must stage it for 
      // later ourselves.
      if (shouldPhoneHomeIfNecessary && installData.currentApp) {
        var installLocation = getInstallLocation(installData.id, aInstallLocationKey);
        if (!installLocation) {
          installManifestFile.remove(false);
          return;
        }
        var stagedFile = installLocation.stageFile(aXPIFile, installData.id);
        (new IncompatibleObserver(this)).checkForUpdates(installManifest, 
                                                         installData, stagedFile,
                                                         installManifestFile);
        // Return early to prevent deletion of the install manifest file.
        return;
      }
      else {
        // XXXben Look up XULRunnerSettingsThingy to see if there is a registered
        //        app that can handle this item, if so just stage and don't show
        //        this error!
        showIncompatibleError(installData);
      }
      break;
    case INSTALLERROR_SUCCESS:
      // Installation of multiple extensions / themes contained within a single xpi.
      if (installData.type == nsIUpdateItem.TYPE_MULTI_XPI) {
        installMultiXPI(aXPIFile, installData);
        break;
      }

      // Stage the extension's XPI so it can be extracted at the next restart.
      var installLocation = getInstallLocation(installData.id, aInstallLocationKey);
      if (!installLocation) {
        // No cleanup of any of the staged XPI files should be required here, 
        // because this should only ever fail on the first recurse through
        // this function, BEFORE staging takes place... technically speaking
        // a location could become readonly during the phone home process, 
        // but that's an edge case I don't care about.
        installManifestFile.remove(false);
        return;
      }

      // Stage a copy of the XPI/JAR file for our own evil purposes...
      stagedFile = installLocation.stageFile(aXPIFile, installData.id);
      
      var restartRequired = this.installRequiresRestart(installData.id, 
                                                        installData.type);
      // Determine which configuration function to use based on whether or not
      // there is data about this item in our datasource already - if there is 
      // we want to upgrade, otherwise we install fresh.
      var ds = this.datasource;
      if (installData.id in ds.visibleItems && ds.visibleItems[installData.id]) {
        // We enter this function if any data corresponding to an existing GUID
        // is found, regardless of its Install Location. We need to check before
        // "upgrading" an item that Install Location of the new item is of equal
        // or higher priority than the old item, to make sure the datasource only
        // ever tracks metadata for active items.
        var oldInstallLocation = this.getInstallLocation(installData.id);
        if (oldInstallLocation.priority >= installLocation.priority) {
          this._upgradeItem(installManifest, installData.id, installLocation, 
                            installData.type);
          if (!restartRequired) {
            this._finalizeUpgrade(installData.id, installLocation);
            this._finalizeInstall(installData.id, stagedFile);
          }
        }
      }
      else {
        this._configureForthcomingItem(installManifest, installData.id, 
                                        installLocation, installData.type);
        if (!restartRequired)
          this._finalizeInstall(installData.id, stagedFile);
      }
      this._updateManifests(restartRequired);
      break;
    case INSTALLERROR_INVALID_GUID:
      LOG("Invalid GUID: Item has GUID: \"" + installData.id + "\"" + 
          " which is not well-formed.");
      var bundle = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
      showMessage("incompatibleTitle", 
                  [bundle.GetStringFromName("type-" + installData.type)], 
                  "invalidGUIDMessage", [installData.name, installData.id]);
      break;
    case INSTALLERROR_INVALID_VERSION:
      LOG("Invalid Version: Item: \"" + installData.id + "\" has version " + 
          installData.version + " which is not well-formed.");
      var bundle = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
      showMessage("incompatibleTitle", 
                  [bundle.GetStringFromName("type-" + installData.type)], 
                  "invalidVersionMessage", [installData.name, installData.version]);
      break;
    case INSTALLERROR_INCOMPATIBLE_PLATFORM:
      const osABI = gOSTarget + "_" + gXPCOMABI;
      LOG("Incompatible Platform: Item: \"" + installData.id + "\" is not " + 
          "compatible with '" + osABI + "'.");
      var bundle = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
      showMessage("incompatibleTitle", 
                  [bundle.GetStringFromName("type-" + installData.type)], 
                  "incompatiblePlatformMessage",
                  [installData.name, BundleManager.appName, osABI]);
      break;
    case INSTALLERROR_BLOCKLISTED:
      LOG("Blocklisted Item: Item: \"" + installData.id + "\" version " + 
          installData.version + " was not installed.");
      showBlocklistMessage([installData], true);
      break;
    default:
      break;
    }
    
    // Check to see if this item supports other applications and in that case
    // stage the the XPI file in the location specified by those applications.
    stageXPIForOtherApps(aXPIFile, installData);

    installManifestFile.remove(false);
  },
  
  /**
   * Whether or not this type's installation/uninstallation requires 
   * the application to be restarted.
   * @param   id
   *          The GUID of the item
   * @param   type
   *          The nsIUpdateItem type of the item
   * @returns true if installation of an item of this type requires a 
   *          restart.
   */
  installRequiresRestart: function(id, type) {
    switch (type) {
    case nsIUpdateItem.TYPE_THEME:
      var internalName = this.datasource.getItemProperty(id, "internalName");
      var needsRestart = false;
      if (gPref.prefHasUserValue(PREF_DSS_SKIN_TO_SELECT))
        needsRestart = internalName == gPref.getCharPref(PREF_DSS_SKIN_TO_SELECT);
      if (!needsRestart &&
          gPref.prefHasUserValue(PREF_GENERAL_SKINS_SELECTEDSKIN))
        needsRestart = internalName == gPref.getCharPref(PREF_GENERAL_SKINS_SELECTEDSKIN);
      return needsRestart;
    }
    return true;
  },
  
  /**
   * Perform initial configuration on an item that has just or will be 
   * installed. This inserts the item into the appropriate container in the
   * datasource, so that the application UI shows the item even if it will
   * not actually be installed until the next restart.
   * @param   installManifest 
   *          The Install Manifest datasource that describes this item.
   * @param   id          
   *          The GUID of this item.
   * @param   installLocation
   *          The Install Location where this item is installed.
   * @param   type
   *          The nsIUpdateItem type of this item. 
   */  
  _configureForthcomingItem: function(installManifest, id, installLocation, type) {
    var ds = this.datasource;
    ds.updateVisibleList(id, installLocation.name, false);
    var props = { name            : EM_L(getManifestProperty(installManifest, "name")),
                  version         : EM_L(getManifestProperty(installManifest, "version")),
                  installLocation : EM_L(installLocation.name),
                  type            : EM_I(type),
                  availableUpdateURL    : null,
                  availableUpdateHash   : null,
                  availableUpdateVersion: null };
    for (var p in props)
      ds.setItemProperty(id, EM_R(p), props[p]);
    ds.updateProperty(id, "availableUpdateURL");
    
    this._setOp(id, OP_NEEDS_INSTALL);
    
    // Insert it into the child list NOW rather than later because:
    // - extensions installed using the command line need to be a member
    //   of a container during the install phase for the code to be able
    //   to identify profile vs. global
    // - extensions installed through the UI should show some kind of
    //   feedback to indicate their presence is forthcoming (i.e. they
    //   will be available after a restart).
    ds.insertItemIntoContainer(id);
    
    this._notifyAction(id, EM_ITEM_INSTALLED);
  },
  
  /**
   * Perform configuration on an item that has just or will be upgraded.
   * @param   installManifest
   *          The Install Manifest datasource that describes this item.
   * @param   itemID
   *          The GUID of this item.
   * @param   installLocation
   *          The Install Location where this item is installed.
   * @param   type
   *          The nsIUpdateItem type of this item. 
   */
  _upgradeItem: function (installManifest, id, installLocation, type) {
    // Don't change any props that would need to be reset if the install fails.
    // They will be reset as appropriate by the upgrade/install process.
    var ds = this.datasource;
    ds.updateVisibleList(id, installLocation.name, false);
    var props = { installLocation : EM_L(installLocation.name),
                  type            : EM_I(type),
                  availableUpdateURL      : null,
                  availableUpdateHash     : null,
                  availableUpdateVersion  : null };
    for (var p in props)
      ds.setItemProperty(id, EM_R(p), props[p]);
    ds.updateProperty(id, "availableUpdateURL");

    this._setOp(id, OP_NEEDS_UPGRADE);
    this._notifyAction(id, EM_ITEM_UPGRADED);
  },

  /** 
   * Completes an Extension's installation.
   * @param   id
   *          The GUID of the Extension to install.
   * @param   file
   *          The XPI/JAR file to install from. If this is null, we try to
   *          determine the stage file location from the ID.
   */
  _finalizeInstall: function(id, file) {
    var ds = this.datasource;
    var type = ds.getItemProperty(id, "type");
    if (id == 0 || id == -1) {
      ds.removeCorruptItem(id, type);
      return;
    }
    var installLocation = this.getInstallLocation(id);
    if (!installLocation) {
      // If the install location is null, that means we've reached the finalize
      // state without the item ever having metadata added for it, which implies
      // bogus data in the Startup Cache. Clear the entries and don't do anything
      // else.
      var entries = StartupCache.findEntries(id);
      for (var i = 0; i < entries.length; ++i) {
        var location = InstallLocations.get(entries[i].location);
        StartupCache.clearEntry(location, id);
        PendingOperations.clearItem(OP_NEEDS_INSTALL, id);
      }
      return;
    }
    var itemLocation = installLocation.getItemLocation(id);

    if (!file && "stageFile" in installLocation)
      file = installLocation.getStageFile(id);
    
    // If |file| is null or does not exist, the installer assumes the item is
    // a dropped-in directory.
    var installer = new Installer(this.datasource, id, installLocation, type);
    installer.installFromFile(file);

    // If the file was staged, we must clean it up ourselves, otherwise the 
    // EM caller is responsible for doing so (e.g. XPInstall)
    if (file)
      installLocation.removeFile(file);
    
    // Clear the op flag from the Startup Cache and Pending Operations sets
    StartupCache.put(installLocation, id, OP_NONE, true);
    PendingOperations.clearItem(OP_NEEDS_INSTALL, id);
  },

  /**
   * Removes an item's metadata in preparation for an upgrade-install.
   * @param   id
   *          The GUID of the item to uninstall.
   * @param   installLocation
   *          The nsIInstallLocation of the item
   */
  _finalizeUpgrade: function(id, installLocation) {
    // Retrieve the item properties *BEFORE* we clean the resource!
    var ds = this.datasource;

    var stagedFile = null;
    if ("getStageFile" in installLocation)
      stagedFile = installLocation.getStageFile(id);

    if (stagedFile)
      var installRDF = extractRDFFileToTempDir(stagedFile, FILE_INSTALL_MANIFEST, true);
    else
      installRDF = installLocation.getItemFile(id, FILE_INSTALL_MANIFEST);
    if (installRDF.exists()) {
      var installManifest = getInstallManifest(installRDF);
      if (installManifest) {
        var type = getAddonTypeFromInstallManifest(installManifest);
        var userDisabled = ds.getItemProperty(id, "userDisabled") == "true";

        // Clean the item resource
        ds.removeItemMetadata(id);
        // Now set up the properties on the item to mimic an item in its
        // "initial state" for installation.
        this._configureForthcomingItem(installManifest, id, installLocation, 
                                       type);
        if (userDisabled)
          ds.setItemProperty(id, EM_R("userDisabled"), EM_L("true"));
      }
      if (stagedFile)
        installRDF.remove(false);
    }
    // Clear the op flag from the Pending Operations set. Do NOT clear op flag in 
    // the startup cache since this may have been reset to OP_NEEDS_INSTALL by
    // |_configureForthcomingItem|.
    PendingOperations.clearItem(OP_NEEDS_UPGRADE, id);
  },
  
  /**
   * Completes an item's uninstallation.
   * @param   id
   *          The GUID of the item to uninstall.
   */
  _finalizeUninstall: function(id) {
    var ds = this.datasource;
    
    var installLocation = this.getInstallLocation(id);
    if (!installLocation.itemIsManagedIndependently(id)) {
      try {
        // Having a callback that does nothing just causes the directory to be
        // removed.
        safeInstallOperation(id, installLocation, 
                             { data: null, callback: function() { } });
      }
      catch (e) {
        LOG("_finalizeUninstall: failed to remove directory for item: " + id + 
            " at Install Location: " + installLocation.name + ", rolling back uninstall");
        // Removal of the files failed, reset the uninstalled flag and rewrite
        // the install manifests so this item's components are registered.
        // Clear the op flag from the Startup Cache
        StartupCache.put(installLocation, id, OP_NONE, true);
        var restartRequired = this.installRequiresRestart(id, ds.getItemProperty(id, "type"))
        this._updateManifests(restartRequired);
        return;
      }
    }
    else if (installLocation.name == KEY_APP_PROFILE ||
             installLocation.name == KEY_APP_GLOBAL) {
      // Check for a pointer file and remove it if it exists
      var pointerFile = installLocation.location.clone();
      pointerFile.append(id);
      if (pointerFile.exists() && !pointerFile.isDirectory())
        pointerFile.remove(false);
    }
    
    // Clean the item resource
    ds.removeItemMetadata(id);
    
    // Do this LAST since inferences are made about an item based on
    // what container it's in.
    ds.removeItemFromContainer(id);
    
    // Clear the op flag from the Startup Cache and the Pending Operations set.
    StartupCache.clearEntry(installLocation, id);
    PendingOperations.clearItem(OP_NEEDS_UNINSTALL, id);
  },
  
  /**
   * Uninstalls an item. If the uninstallation cannot be performed immediately
   * it is scheduled for the next restart.
   * @param   id
   *          The GUID of the item to uninstall.
   */
  uninstallItem: function(id) {
    var ds = this.datasource;
    ds.updateDownloadState(PREFIX_ITEM_URI + id, null);
    if (!ds.isDownloadItem(id)) {
      var opType = ds.getItemProperty(id, "opType");
      var installLocation = this.getInstallLocation(id);
      // Removes any staged xpis for this item.
      if (opType == OP_NEEDS_UPGRADE || opType == OP_NEEDS_INSTALL) {
        var stageFile = installLocation.getStageFile(id);
        if (stageFile)
          installLocation.removeFile(stageFile);
      }
      // Addons with an opType of OP_NEEDS_INSTALL only have a staged xpi file
      // and are removed immediately since the uninstall can't be canceled.
      if (opType == OP_NEEDS_INSTALL) {
        ds.removeItemMetadata(id);
        ds.removeItemFromContainer(id);
        ds.updateVisibleList(id, null, true);
        StartupCache.clearEntry(installLocation, id);
        this._updateManifests(false);
      }
      else {
        this._setOp(id, OP_NEEDS_UNINSTALL);
        var type = ds.getItemProperty(id, "type");
        var restartRequired = this.installRequiresRestart(id, type);
        if (!restartRequired) {
          this._finalizeUninstall(id);
          this._updateManifests(restartRequired);
        }
      }
    }
    else {
      // Bad download entry - uri is url, e.g. "http://www.foo.com/test.xpi"
      // ... just remove it from the list. 
      ds.removeCorruptDLItem(id);
    }
    
    this._notifyAction(id, EM_ITEM_UNINSTALLED);
  },

  /**
   * Cancels a pending uninstall of an item
   * @param   id
   *          The ID of the item.
   */
  cancelUninstallItem: function(id) {
    var ds = this.datasource;
    var appDisabled = ds.getItemProperty(id, "appDisabled");
    var userDisabled = ds.getItemProperty(id, "userDisabled");
    if (appDisabled == "true" || appDisabled == OP_NONE && userDisabled == OP_NONE) {
      this._setOp(id, OP_NONE);
      this._notifyAction(id, EM_ITEM_CANCEL);
    }
    else if (appDisabled == OP_NEEDS_DISABLE || userDisabled == OP_NEEDS_DISABLE) {
      this._setOp(id, OP_NEEDS_DISABLE);
      this._notifyAction(id, EM_ITEM_DISABLED);
    }
    else if (appDisabled == OP_NEEDS_ENABLE || userDisabled == OP_NEEDS_ENABLE) {
      this._setOp(id, OP_NEEDS_ENABLE);
      this._notifyAction(id, EM_ITEM_ENABLED);
    }
    else {
      this._setOp(id, OP_NONE);
      this._notifyAction(id, EM_ITEM_CANCEL);
    }
  },

  /**
   * Sets the pending operation for a visible item. 
   * @param   id
   *          The GUID of the item
   * @param   op
   *          The name of the operation to be performed
   */  
  _setOp: function(id, op) {
    var location = this.getInstallLocation(id);
    StartupCache.put(location, id, op, true);
    PendingOperations.addItem(op, { locationKey: location.name, id: id });
    var ds = this.datasource;
    if (op == OP_NEEDS_INSTALL || op == OP_NEEDS_UPGRADE)
      ds.updateDownloadState(PREFIX_ITEM_URI + id, "success");

    ds.updateProperty(id, "opType");
    ds.updateProperty(id, "updateable");
    ds.updateProperty(id, "satisfiesDependencies");
    var restartRequired = this.installRequiresRestart(id, ds.getItemProperty(id, "type"))
    this._updateDependentItemsForID(id);
    this._updateManifests(restartRequired);
  },
  
  /**
   * Note on appDisabled and userDisabled property arcs.
   * The appDisabled and userDisabled RDF property arcs are used to store
   * the pending operation for app disabling and user disabling for an item as
   * well as the user and app disabled status after the pending operation has
   * been completed upon restart. When the appDisabled value changes the value
   * of userDisabled is reset to prevent the state of widgets and status
   * messages from being in an incorrect state.
   */

  /**
   * Enables an item for the application (e.g. the item satisfies all
   * requirements like app compatibility for it to be enabled). The appDisabled
   * property arc will be removed if the item will be app disabled on next
   * restart to cancel the app disabled operation for the item otherwise the
   * property value will be set to OP_NEEDS_ENABLE. The item's pending
   * operations are then evaluated in order to set the operation to perform
   * and notify the observers if the operation has been changed.
   * See "Note on appDisabled and userDisabled property arcs" above.
   * @param   id
   *          The ID of the item to be enabled by the application.
   */
  _appEnableItem: function(id) {
    var ds = this.datasource;
    var appDisabled = ds.getItemProperty(id, "appDisabled");
    if (appDisabled == OP_NONE || appDisabled == OP_NEEDS_ENABLE)
      return;

    var opType = ds.getItemProperty(id, "opType");
    var userDisabled = ds.getItemProperty(id, "userDisabled");
    // reset user disabled if it has a pending operation to prevent the ui
    // state from getting confused as to an item's current state.
    if (userDisabled == OP_NEEDS_DISABLE)
      ds.setItemProperty(id, EM_R("userDisabled"), null);
    else if (userDisabled == OP_NEEDS_ENABLE)
      ds.setItemProperty(id, EM_R("userDisabled"), EM_L("true"));

    if (appDisabled == OP_NEEDS_DISABLE)
      ds.setItemProperty(id, EM_R("appDisabled"), null);
    else if (appDisabled == "true")
      ds.setItemProperty(id, EM_R("appDisabled"), EM_L(OP_NEEDS_ENABLE));

    // Don't set a new operation when there is a pending uninstall operation.
    if (opType == OP_NEEDS_UNINSTALL) {
      this._updateDependentItemsForID(id);
      return;
    }

    var operation, action;
    // if this item is already enabled or user disabled don't set a pending
    // operation - instead immediately enable it and reset the operation type
    // if needed.
    if (appDisabled == OP_NEEDS_DISABLE || appDisabled == OP_NONE ||
        userDisabled == "true") {
      if (opType != OP_NONE) {
        operation = OP_NONE;
        action = EM_ITEM_CANCEL;
      }
    }
    else {
      if (opType != OP_NEEDS_ENABLE) {
        operation = OP_NEEDS_ENABLE;
        action = EM_ITEM_ENABLED;
      }
    }

    if (action) {
      this._setOp(id, operation);
      this._notifyAction(id, action);
    }
    else {
      ds.updateProperty(id, "satisfiesDependencies");
      this._updateDependentItemsForID(id);
    }
  },

  /**
   * Disables an item for the application (e.g. the item doesn't satisfy all
   * requirements like app compatibility for it to be enabled). The appDisabled
   * property arc will be set to true if the item will be app enabled on next
   * restart to cancel the app enabled operation for the item otherwise the
   * property value will be set to OP_NEEDS_DISABLE. The item's pending
   * operations are then evaluated in order to set the operation to perform
   * and notify the observers if the operation has been changed.
   * See "Note on appDisabled and userDisabled property arcs" above.
   * @param   id
   *          The ID of the item to be disabled by the application.
   */
  _appDisableItem: function(id) {
    var ds = this.datasource;
    var appDisabled = ds.getItemProperty(id, "appDisabled");
    if (appDisabled == "true" || appDisabled == OP_NEEDS_DISABLE)
      return;

    var opType = ds.getItemProperty(id, "opType");
    var userDisabled = ds.getItemProperty(id, "userDisabled");

    // reset user disabled if it has a pending operation to prevent the ui
    // state from getting confused as to an item's current state.
    if (userDisabled == OP_NEEDS_DISABLE)
      ds.setItemProperty(id, EM_R("userDisabled"), null);
    else if (userDisabled == OP_NEEDS_ENABLE)
      ds.setItemProperty(id, EM_R("userDisabled"), EM_L("true"));

    if (appDisabled == OP_NEEDS_ENABLE || userDisabled == OP_NEEDS_ENABLE ||
        ds.getItemProperty(id, "userDisabled") == "true")
      ds.setItemProperty(id, EM_R("appDisabled"), EM_L("true"));
    else if (appDisabled == OP_NONE)
      ds.setItemProperty(id, EM_R("appDisabled"), EM_L(OP_NEEDS_DISABLE));

    // Don't set a new operation when there is a pending uninstall operation.
    if (opType == OP_NEEDS_UNINSTALL) {
      this._updateDependentItemsForID(id);
      return;
    }

    var operation, action;
    // if this item is already disabled don't set a pending operation - instead
    // immediately disable it and reset the operation type if needed.
    if (appDisabled == OP_NEEDS_ENABLE || appDisabled == "true" ||
        userDisabled == OP_NEEDS_ENABLE || userDisabled == "true") {
      if (opType != OP_NONE) {
        operation = OP_NONE;
        action = EM_ITEM_CANCEL;
      }
    }
    else {
      if (opType != OP_NEEDS_DISABLE) {
        operation = OP_NEEDS_DISABLE;
        action = EM_ITEM_DISABLED;
      }
    }

    if (action) {
      this._setOp(id, operation);
      this._notifyAction(id, action);
    }
    else {
      ds.updateProperty(id, "satisfiesDependencies");
      this._updateDependentItemsForID(id);
    }
  },
    
  /**
   * Sets an item to be enabled by the user. If the item is already enabled this
   * clears the needs-enable operation for the next restart.
   * See "Note on appDisabled and userDisabled property arcs" above.
   * @param   id
   *          The ID of the item to be enabled by the user.
   */
  enableItem: function(id) {
    var ds = this.datasource;
    var opType = ds.getItemProperty(id, "opType");
    var appDisabled = ds.getItemProperty(id, "appDisabled");
    var userDisabled = ds.getItemProperty(id, "userDisabled");

    var operation, action;
    // if this item is already enabled don't set a pending operation - instead
    // immediately enable it and reset the operation type if needed.
    if (appDisabled == OP_NONE &&
        userDisabled == OP_NEEDS_DISABLE || userDisabled == OP_NONE) {
      if (userDisabled == OP_NEEDS_DISABLE)
        ds.setItemProperty(id, EM_R("userDisabled"), null);
      if (opType != OP_NONE) {
        operation = OP_NONE;
        action = EM_ITEM_CANCEL;
      }
    }
    else {
      if (userDisabled == "true")
        ds.setItemProperty(id, EM_R("userDisabled"), EM_L(OP_NEEDS_ENABLE));
      if (opType != OP_NEEDS_ENABLE) {
        operation = OP_NEEDS_ENABLE;
        action = EM_ITEM_ENABLED;
      }
    }

    if (action) {
      this._setOp(id, operation);
      this._notifyAction(id, action);
    }
    else {
      ds.updateProperty(id, "satisfiesDependencies");
      this._updateDependentItemsForID(id);
    }
  },
  
  /**
   * Sets an item to be disabled by the user. If the item is already disabled
   * this clears the needs-disable operation for the next restart.
   * See "Note on appDisabled and userDisabled property arcs" above.
   * @param   id
   *          The ID of the item to be disabled by the user.
   */
  disableItem: function(id) {
    var ds = this.datasource;
    var opType = ds.getItemProperty(id, "opType");
    var appDisabled = ds.getItemProperty(id, "appDisabled");
    var userDisabled = ds.getItemProperty(id, "userDisabled");

    var operation, action;
    // if this item is already disabled don't set a pending operation - instead
    // immediately disable it and reset the operation type if needed.
    if (userDisabled == OP_NEEDS_ENABLE || userDisabled == "true" ||
        appDisabled == OP_NEEDS_ENABLE) {
      if (userDisabled != "true")
        ds.setItemProperty(id, EM_R("userDisabled"), EM_L("true"));
      if (opType != OP_NONE) {
        operation = OP_NONE;
        action = EM_ITEM_CANCEL;
      }
    }
    else {
      if (userDisabled == OP_NONE)
        ds.setItemProperty(id, EM_R("userDisabled"), EM_L(OP_NEEDS_DISABLE));
      if (opType != OP_NEEDS_DISABLE) {
        operation = OP_NEEDS_DISABLE;
        action = EM_ITEM_DISABLED;
      }
    }

    if (action) {
      this._setOp(id, operation);
      this._notifyAction(id, action);
    }
    else {
      ds.updateProperty(id, "satisfiesDependencies");
      this._updateDependentItemsForID(id);
    }
  },
  
  /**
   * Determines whether an item should be disabled by the application.
   * @param   id
   *          The ID of the item to check
   */
  _isUsableItem: function(id) {
    var ds = this.datasource;
    return ((!gCheckCompatibility || ds.getItemProperty(id, "compatible") == "true") &&
            ds.getItemProperty(id, "blocklisted") == "false" &&
            ds.getItemProperty(id, "satisfiesDependencies") == "true");
  },

  /**
   * Sets an item's dependent items disabled state for the app based on whether
   * its dependencies are met and the item is compatible.
   * @param   id
   *          The ID of the item whose dependent items will be checked
   */
  _updateDependentItemsForID: function(id) {
    var ds = this.datasource;
    var dependentItems = this.getDependentItemListForID(id, true, { });
    for (var i = 0; i < dependentItems.length; ++i) {
      var dependentID = dependentItems[i].id;
      ds.updateProperty(dependentID, "satisfiesDependencies");
      if (this._isUsableItem(dependentID))
        this._appEnableItem(dependentID);
      else
        this._appDisableItem(dependentID);
    }
  },

  /**
   * Notify observers of a change to an item that has been requested by the
   * user. 
   */
  _notifyAction: function(id, reason) {
    gOS.notifyObservers(this.datasource.getItemForID(id), 
                        EM_ACTION_REQUESTED_TOPIC, reason);
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  update: function(items, itemCount, versionUpdateOnly, listener) {
    var appID = gApp.ID;
    var appVersion = gApp.version;

    if (items.length == 0)
      items = this.getItemList(nsIUpdateItem.TYPE_ADDON, { });

    var updater = new ExtensionItemUpdater(appID, appVersion, this);
    updater.checkForUpdates(items, items.length, versionUpdateOnly, listener);
  },


  /**
   * Checks for changes to the blocklist using the local blocklist file,
   * application disables / enables items that have been added / removed from
   * the blocklist, and if there are additions to the blocklist this will
   * inform the user by displaying a list of the items added.
   *
   * XXXrstrong - this method is not terribly useful and was added so we can
   * trigger this check from the additional timer used by blocklisting.
   */
  checkForBlocklistChanges: function() {
    var ds = this.datasource;
    var items = this.getItemList(nsIUpdateItem.TYPE_ADDON, { });
    for (var i = 0; i < items.length; ++i) {
      var id = items[i].id;
      ds.updateProperty(id, "blocklisted");
      if (this._isUsableItem(id))
        this._appEnableItem(id);
    }

    items = ds.getBlocklistedItemList(null, null, nsIUpdateItem.TYPE_ADDON,
                                      false);
    for (i = 0; i < items.length; ++i)
      this._appDisableItem(items[i].id);

    // show the blocklist notification window if there are new blocklist items.
    if (items.length > 0)
      showBlocklistMessage(items, false);
  },

  /**
   * @returns An enumeration of all registered Install Locations.
   */
  get installLocations () {
    return InstallLocations.enumeration;
  },
  
  /**
   * Gets the Install Location where a visible Item is stored.
   * @param   id
   *          The GUID of the item to locate an Install Location for.
   * @returns The Install Location object where the item is stored.
   */
  getInstallLocation: function(id) {
    var key = this.datasource.visibleItems[id];
    return key ? InstallLocations.get(this.datasource.visibleItems[id]) : null;
  },
  
  /**
   * Gets a nsIUpdateItem for the item with the specified id.
   * @param   id
   *          The GUID of the item to construct a nsIUpdateItem for.
   * @returns The nsIUpdateItem representing the item.
   */
  getItemForID: function(id) {
    return this.datasource.getItemForID(id);
  },
  
  /**
   * Retrieves a list of installed nsIUpdateItems of items that are dependent
   * on another item.
   * @param   id
   *          The ID of the item that other items depend on.
   * @param   includeDisabled
   *          Whether to include disabled items in the set returned.
   * @param   countRef
   *          The XPCJS reference to the number of items returned.
   * @returns An array of installed nsIUpdateItems that depend on the item
   *          specified by the id parameter.
   */
  getDependentItemListForID: function(id, includeDisabled, countRef) {
    return this.datasource.getDependentItemListForID(id, includeDisabled, countRef);
  },

  /**
   * Retrieves a list of nsIUpdateItems of items matching the specified type.
   * @param   type
   *          The type of item to return.
   * @param   countRef
   *          The XPCJS reference to the number of items returned.
   * @returns An array of nsIUpdateItems matching the id/type filter.
   */
  getItemList: function(type, countRef) {
    return this.datasource.getItemList(type, countRef);
  },

  /**  
   * See nsIExtensionManager.idl
   */
  getIncompatibleItemList: function(id, version, type, includeDisabled, 
                                    countRef) {
    var items = this.datasource.getIncompatibleItemList(id, version ? version : undefined,
                                                        type, includeDisabled);
    countRef.value = items.length;
    return items;
  },
  
  /**
   * Move an Item to the index of another item in its container.
   * @param   movingID
   *          The ID of the item to be moved.
   * @param   destinationID
   *          The ID of an item to move another item to.
   */
  moveToIndexOf: function(movingID, destinationID) {
    this.datasource.moveToIndexOf(movingID, destinationID);
  },

  /**
   * Sorts addons of the specified type by the specified property starting from
   * the top of their container. If the addons are already sorted then no action
   * is performed.
   * @param   type
   *          The nsIUpdateItem type of the items to sort.
   * @param   propertyName
   *          The RDF property name used for sorting.
   * @param   isAscending
   *          true to sort ascending and false to sort descending
   */
  sortTypeByProperty: function(type, propertyName, isAscending) {
    this.datasource.sortTypeByProperty(type, propertyName, isAscending);
  },

  /////////////////////////////////////////////////////////////////////////////    
  // Downloads
  _transactions: [],
  _downloadCount: 0,
  
  /**
   * Ask the user if they really want to quit the application, since this will 
   * cancel one or more Extension/Theme downloads.
   * @param   subject
   *          A nsISupportsPRBool which this function sets to false if the user
   *          wishes to cancel all active downloads and quit the application,
   *          false otherwise.
   */
  _confirmCancelDownloadsOnQuit: function(subject) {
    if (this._downloadCount > 0) {
      // The observers will be notified again after this so set the download
      // count to 0 to prevent this dialog from being displayed again.
      this._downloadCount = 0;
      var result;
//@line 5570 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"
      result = this._confirmCancelDownloads(this._downloadCount, 
                                            "quitCancelDownloadsAlertTitle",
                                            "quitCancelDownloadsAlertMsgMultiple",
                                            "quitCancelDownloadsAlertMsg",
                                            "dontQuitButtonWin");
//@line 5582 "/cdisk/linden/llmozlib2/build_mozilla/mozilla/toolkit/mozapps/extensions/src/nsExtensionManager.js.in"
      if (!result)
        this._cancelDownloads();
      if (subject instanceof Components.interfaces.nsISupportsPRBool)
        subject.data = result;
    }
  },
  
  /**
   * Ask the user if they really want to go offline, since this will cancel 
   * one or more Extension/Theme downloads.
   * @param   subject
   *          A nsISupportsPRBool which this function sets to false if the user
   *          wishes to cancel all active downloads and go offline, false
   *          otherwise.
   */
  _confirmCancelDownloadsOnOffline: function(subject) {
    if (this._downloadCount > 0) {
      result = this._confirmCancelDownloads(this._downloadCount,
                                            "offlineCancelDownloadsAlertTitle",
                                            "offlineCancelDownloadsAlertMsgMultiple",
                                            "offlineCancelDownloadsAlertMsg",
                                            "dontGoOfflineButton");
      if (!result)
        this._cancelDownloads();
      if (subject instanceof Components.interfaces.nsISupportsPRBool)
        subject.data = result;
    }
  },
  
  /**
   * Cancels all active downloads and removes them from the applicable UI.
   */
  _cancelDownloads: function() {
    for (var i = 0; i < this._transactions.length; ++i)
      gOS.notifyObservers(this._transactions[i], "xpinstall-progress", "cancel");

    this._removeAllDownloads();
  },

  /**
   * Ask the user whether or not they wish to cancel the Extension/Theme
   * downloads which are currently under way.
   * @param   count
   *          The number of active downloads.
   * @param   title
   *          The key of the title for the message box to be displayed
   * @param   cancelMessageMultiple
   *          The key of the message to be displayed in the message box
   *          when there are > 1 active downloads.
   * @param   cancelMessageSingle
   *          The key of the message to be displayed in the message box
   *          when there is just one active download.
   * @param   dontCancelButton
   *          The key of the label to be displayed on the "Don't Cancel 
   *          Downloads" button.
   */
  _confirmCancelDownloads: function(count, title, cancelMessageMultiple, 
                                    cancelMessageSingle, dontCancelButton) {
    var bundle = BundleManager.getBundle(URI_DOWNLOADS_PROPERTIES);
    var title = bundle.GetStringFromName(title);
    var message, quitButton;
    if (count > 1) {
      message = bundle.formatStringFromName(cancelMessageMultiple, [count], 1);
      quitButton = bundle.formatStringFromName("cancelDownloadsOKTextMultiple", [count], 1);
    }
    else {
      message = bundle.GetStringFromName(cancelMessageSingle);
      quitButton = bundle.GetStringFromName("cancelDownloadsOKText");
    }
    var dontQuitButton = bundle.GetStringFromName(dontCancelButton);
    
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("Extension:Manager");
    const nsIPromptService = Components.interfaces.nsIPromptService;
    var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                       .getService(nsIPromptService);
    var flags = (nsIPromptService.BUTTON_TITLE_IS_STRING * nsIPromptService.BUTTON_POS_0) +
                (nsIPromptService.BUTTON_TITLE_IS_STRING * nsIPromptService.BUTTON_POS_1);
    var rv = ps.confirmEx(win, title, message, flags, quitButton, dontQuitButton, null, null, { });
    return rv == 1;
  },
  
  /** 
   * Adds a set of Item Downloads to the Manager and starts the download
   * operation.
   * @param   items
   *          An array of nsIUpdateItems to begin downlading.
   * @param   itemCount
   *          The length of |items|
   * @param   fromChrome
   *          true when called from chrome
   *          false when not called from chrome (e.g. web page)
   */
  addDownloads: function(items, itemCount, fromChrome) { 
    var ds = this.datasource;
    // Add observers only if they aren't already added for an active download
    if (this._downloadCount == 0) {
      gOS.addObserver(this, "offline-requested", false);
      gOS.addObserver(this, "quit-application-requested", false);
    }
    this._downloadCount += itemCount;
    
    var urls = [];
    var hashes = [];
    var txn = new ItemDownloadTransaction(this);
    for (var i = 0; i < itemCount; ++i) {
      var currItem = items[i];
      var txnID = Math.round(Math.random() * 100);
      txn.addDownload(currItem, txnID);
      this._transactions.push(txn);
      urls.push(currItem.xpiURL);
      hashes.push(currItem.xpiHash ? currItem.xpiHash : null);
      // if this is an update remove the update metadata to prevent it from
      // being updated during an install.
      if (fromChrome) {
        var id = currItem.id
        ds.setItemProperty(id, EM_R("availableUpdateURL"), null);
        ds.setItemProperty(id, EM_R("availableUpdateHash"), null);
        ds.setItemProperty(id, EM_R("availableUpdateVersion"), null);
        ds.updateProperty(id, "availableUpdateURL");
        ds.updateProperty(id, "updateable"); 
      }
      var id = fromChrome ? PREFIX_ITEM_URI + currItem.id : currItem.xpiURL;
      ds.updateDownloadState(id, "waiting");
    }
    
    if (fromChrome) {
      // Initiate an install from chrome
      var xpimgr = 
          Components.classes["@mozilla.org/xpinstall/install-manager;1"].
          createInstance(Components.interfaces.nsIXPInstallManager);
      xpimgr.initManagerWithHashes(urls, hashes, urls.length, txn);
    }
    else
      gOS.notifyObservers(txn, "xpinstall-progress", "open");
  },
  
  /**
   * Removes a download of a URL.
   * @param   url
   *          The URL of the item being downloaded to remove.
   */
  removeDownload: function(url) {
    for (var i = 0; i < this._transactions.length; ++i) {
      if (this._transactions[i].containsURL(url)) {
        this._transactions[i].removeDownload(url);
        return;
      }
    } 
  },
  
  /**
   * Remove all downloads from all transactions.
   */
  _removeAllDownloads: function() {
    for (var i = 0; i < this._transactions.length; ++i)
      this._transactions[i].removeAllDownloads();
  },

  /**
   * Download Operation State has changed from one to another. 
   * 
   * The nsIXPIProgressDialog implementation in the download transaction object
   * forwards notifications through these methods which we then pass on to any
   * front end objects implementing nsIExtensionDownloadListener that 
   * are listening. We maintain the master state of download operations HERE, 
   * not in the front end, because if the user closes the extension or theme 
   * managers during the downloads we need to maintain state and not terminate
   * the download/install process. 
   *
   * @param   transaction
   *          The ItemDownloadTransaction object receiving the download 
   *          notifications from XPInstall.
   * @param   addon
   *          An object representing nsIUpdateItem for the addon being updated
   * @param   state
   *          The state we are entering
   * @param   value
   *          ???
   */
  onStateChange: function(transaction, addon, state, value) {
    for (var i = 0; i < this._updateListeners.length; ++i)
      this._updateListeners[i].onStateChange(addon, state, value);
    var ds = this.datasource;
    var id = addon.id != addon.xpiURL ? PREFIX_ITEM_URI + addon.id : addon.xpiURL;
    const nsIXPIProgressDialog = Components.interfaces.nsIXPIProgressDialog;
    switch (state) {
    case nsIXPIProgressDialog.DOWNLOAD_START:
      ds.updateDownloadState(id, "downloading");
      break;
    case nsIXPIProgressDialog.INSTALL_START:
      ds.updateDownloadState(id, "finishing");
      ds.updateDownloadProgress(id, null);
      break;
    case nsIXPIProgressDialog.INSTALL_DONE:
      --this._downloadCount;
      // From nsInstall.h
      // SUCCESS        = 0
      // REBOOT_NEEDED  = 999
      // USER_CANCELLED = -210
      if (value != 0 && value != 999 && value != -210 && id != addon.xpiURL) {
        ds.updateDownloadState(id, "failure");
        ds.updateDownloadProgress(id, null);
      }
      this.removeDownload(addon.xpiURL);
      break;
    case nsIXPIProgressDialog.DIALOG_CLOSE:
      for (var i = 0; i < this._transactions.length; ++i) {
        if (this._transactions[i].id == transaction.id) {
          this._transactions.splice(i, 1);
          delete transaction;
          // Remove the observers when all transactions have completed.
          if (this._transactions.length == 0) {
            gOS.removeObserver(this, "offline-requested");
            gOS.removeObserver(this, "quit-application-requested");
          }
          break;
        }
      }
      break;
    }
  },
  
  onProgress: function(addon, value, maxValue) {
    for (var i = 0; i < this._updateListeners.length; ++i)
      this._updateListeners[i].onProgress(addon, value, maxValue);
    
    var id = addon.id != addon.xpiURL ? PREFIX_ITEM_URI + addon.id : addon.xpiURL;
    var progress = Math.round((value / maxValue) * 100);
    this.datasource.updateDownloadProgress(id, progress);
  },

  _updateListeners: [],
  addUpdateListener: function(listener) {
    for (var i = 0; i < this._updateListeners.length; ++i) {
      if (this._updateListeners[i] == listener)
        return i;
    }
    this._updateListeners.push(listener);
    return this._updateListeners.length - 1;
  },
  
  removeUpdateListenerAt: function(index) {
    this._updateListeners.splice(index, 1);
  },

  /**
   * The Extensions RDF Datasource
   */
  _ds: null,

  /** 
   * Loads the Extensions Datasource. This should not be called unless: 
   * - a piece of Extensions UI is being shown, or
   * - on startup and there has been a change to an Install Location
   * ... it should NOT be called on every startup!
   */
  _ensureDS: function() {
    if (!this._ds) {
      this._ds = new ExtensionsDataSource(this);
      if (this._ds)
        this._ds.loadExtensions();
    }
  },

  /**
   * See nsIExtensionManager.idl
   */
  get datasource() {
    this._ensureDS();
    return this._ds.QueryInterface(Components.interfaces.nsIRDFDataSource);
  },
  
  /**
   * See nsIClassInfo.idl
   */
  getInterfaces: function(count) {
    var interfaces = [Components.interfaces.nsIExtensionManager,
                      Components.interfaces.nsIXPIProgressDialog,
                      Components.interfaces.nsIObserver];
    count.value = interfaces.length;
    return interfaces;
  },
  getHelperForLanguage: function(language) { 
    return null;
  },
  get contractID() {
    return "@mozilla.org/extensions/manager;1";
  },
  get classDescription() {
    return "Extension Manager";
  },
  get classID() {
    return Components.ID("{8A115FAA-7DCB-4e8f-979B-5F53472F51CF}");
  },
  get implementationLanguage() {
    return Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
  },
  get flags() {
    return Components.interfaces.nsIClassInfo.SINGLETON;
  },

  /**
   * See nsISupports.idl
   */
  QueryInterface: function(iid) {
    if (!iid.equals(Components.interfaces.nsIExtensionManager) &&
        !iid.equals(Components.interfaces.nsIExtensionManager_MOZILLA_1_8_BRANCH) &&
        !iid.equals(Components.interfaces.nsITimerCallback) &&
        !iid.equals(Components.interfaces.nsIObserver) &&
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

/**
 * This object implements nsIXPIProgressDialog and represents a collection of
 * XPI/JAR download and install operations. There is one 
 * ItemDownloadTransaction per back-end XPInstallManager object. We maintain
 * a collection of separate transaction objects because it's possible to have
 * multiple separate XPInstall download/install operations going on 
 * simultaneously, each with its own XPInstallManager instance. For instance
 * you could start downloading two extensions and then download a theme. Each
 * of these operations would open the appropriate FE and have to be able to
 * track each operation independently.
 * 
 * @constructor
 */
function ItemDownloadTransaction(manager) {
  this._manager = manager;
  this._downloads = [];
}
ItemDownloadTransaction.prototype = {
  _manager    : null,
  _downloads  : [],
  id          : -1,
  
  /**
   * Add a download to this transaction
   * @param   addon
   *          An object implementing nsIUpdateItem for the item to be downloaded
   * @param   id
   *          The integer identifier of this transaction
   */
  addDownload: function(addon, id) {
    this._downloads.push({ addon: addon, waiting: true });
    this._manager.datasource.addDownload(addon);
    this.id = id;
  },
  
  /**
   * Removes a download from this transaction
   * @param   url
   *          The URL to remove
   */
  removeDownload: function(url) {
    this._manager.datasource.removeDownload(url);
  },
  
  /**
   * Remove all downloads from this transaction
   */
  removeAllDownloads: function() {
    for (var i = 0; i < this._downloads.length; ++i) {
      var addon = this._downloads[i].addon;
      this.removeDownload(addon.xpiURL);
    }
  },
  
  /**
   * Determine if this transaction is handling the download of a url.
   * @param   url
   *          The URL to look for
   * @returns true if this transaction is downloading the supplied url.
   */
  containsURL: function(url) {
    for (var i = 0; i < this._downloads.length; ++i) {
      if (this._downloads[i].addon.xpiURL == url)
        return true;
    }
    return false;
  },

  /**
   * See nsIXPIProgressDialog.idl
   */
  onStateChange: function(index, state, value) {
    this._manager.onStateChange(this, this._downloads[index].addon, 
                                state, value);
  },
  
  /**
   * See nsIXPIProgressDialog.idl
   */
  onProgress: function(index, value, maxValue) { 
    this._manager.onProgress(this._downloads[index].addon, value, maxValue);
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // nsISupports
  QueryInterface: function(iid) {
    if (!iid.equals(Components.interfaces.nsIXPIProgressDialog) &&
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

/**
 * A listener object to the update check process that routes notifications to
 * the right places and keeps the datasource up to date.
 */
function AddonUpdateCheckListener(listener, datasource) {
  this._listener = listener;
  this._ds = datasource;
}
AddonUpdateCheckListener.prototype = {
  _listener: null,
  _ds: null,
  
  onUpdateStarted: function() {
    if (this._listener)
      this._listener.onUpdateStarted();
    this._ds.onUpdateStarted();
  },
  
  onUpdateEnded: function() {
    if (this._listener)
      this._listener.onUpdateEnded();
    this._ds.onUpdateEnded();
  },
  
  onAddonUpdateStarted: function(addon) {
    if (this._listener)
      this._listener.onAddonUpdateStarted(addon);
    this._ds.onAddonUpdateStarted(addon);
  },
  
  onAddonUpdateEnded: function(addon, status) {
    if (this._listener)
      this._listener.onAddonUpdateEnded(addon, status);
    this._ds.onAddonUpdateEnded(addon, status);
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// ExtensionItemUpdater
//
function ExtensionItemUpdater(aTargetAppID, aTargetAppVersion, aEM) 
{
  this._appID = aTargetAppID;
  this._appVersion = aTargetAppVersion;
  this._emDS = aEM._ds;
  this._em = aEM;

  getVersionChecker();
}

ExtensionItemUpdater.prototype = {
  _appID              : "",
  _appVersion         : "",
  _emDS               : null,
  _em                 : null,
  _versionUpdateOnly  : 0,
  _items              : [],
  _listener           : null,
  _background         : false,
  
  /////////////////////////////////////////////////////////////////////////////
  // ExtensionItemUpdater
  //
  // When we check for updates to an item, there are two pieces of information
  // that are returned - 1) info about the newest available version, if any,
  // and 2) info about the currently installed version. The latter is provided
  // primarily to inform the client of changes to the application compatibility 
  // metadata for the current item. Depending on the situation, either 2 or 
  // 1&2 may be what is required.
  //
  // Callers:
  //  1 - nsUpdateService.js, user event
  //      User clicked on the update icon to invoke an update check, 
  //      user clicked on an Extension/Theme and clicked "Update". In this
  //      case we want to update compatibility metadata about the installed
  //      version, and look for newer versions to offer. 
  //  2 - nsUpdateService.js, background event
  //      Timer fired, background update is being performed. In this case
  //      we also want to update compatibility metadata and look for newer
  //      versions.
  //  3 - Mismatch
  //      User upgraded to a newer version of the app, update compatibility
  //      metadata and look for newer versions.
  //  4 - Install Phone Home
  //      User installed an item that was deemed incompatible based only
  //      on the information provided in the item's install.rdf manifest, 
  //      we look ONLY for compatibility updates in this case to determine
  //      whether or not the item can be installed.
  //  
  checkForUpdates: function(aItems, aItemCount, aVersionUpdateOnly, 
                            aListener) {
    this._listener = new AddonUpdateCheckListener(aListener, this._emDS);
    if (this._listener)
      this._listener.onUpdateStarted();
    this._versionUpdateOnly = aVersionUpdateOnly;
    this._items = aItems;
    this._responseCount = aItemCount;
    
    // This is the number of extensions/themes/etc that we found updates for.
    this._updateCount = 0;

    for (var i = 0; i < aItemCount; ++i) {
      var e = this._items[i];
      if (this._listener)
        this._listener.onAddonUpdateStarted(e);
      (new RDFItemUpdater(this)).checkForUpdates(e, aVersionUpdateOnly);
    }
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // ExtensionItemUpdater
  _applyVersionUpdates: function(aLocalItem, aRemoteItem) {
    var targetAppInfo = this._emDS.getTargetApplicationInfo(aLocalItem.id, this._emDS);
    // If targetAppInfo is null this is for a new install. If the local item's
    // maxVersion does not equal the targetAppInfo maxVersion then this is for
    // an upgrade. In both of these cases return true if the remotely specified
    // maxVersion is greater than the local item's maxVersion.
    if (!targetAppInfo ||
        gVersionChecker.compare(aLocalItem.maxAppVersion, targetAppInfo.maxVersion) != 0) {
      if (gVersionChecker.compare(aLocalItem.maxAppVersion, aRemoteItem.maxAppVersion) < 0)
        return true;
      else
        return false;
    }

    if (gVersionChecker.compare(targetAppInfo.maxVersion, aRemoteItem.maxAppVersion) < 0) {
      // Remotely specified maxVersion is newer than the maxVersion 
      // for the installed Extension. Apply that change to the datasources.
      this._emDS.updateTargetAppInfo(aLocalItem.id, aRemoteItem.minAppVersion,
                                     aRemoteItem.maxAppVersion);

      // If we got here through |checkForMismatches|, this extension has
      // already been disabled, re-enable it.
      var op = StartupCache.entries[aLocalItem.installLocationKey][aLocalItem.id].op;
      if (op == OP_NEEDS_DISABLE ||
          this._emDS.getItemProperty(aLocalItem.id, "appDisabled") == "true")
        this._em._appEnableItem(aLocalItem.id);
      return true;
    }
    else if (this._versionUpdateOnly == 2)
      this._emDS.updateTargetAppInfo(aLocalItem.id, aRemoteItem.minAppVersion,
                                     aRemoteItem.maxAppVersion);
    return false;
  },
  
  _isValidUpdate: function(aLocalItem, aRemoteItem) {
    var appExtensionsVersion = gApp.version;

    // Check if the update will only run on a newer version of Firefox. 
    if (aRemoteItem.minAppVersion && 
        gVersionChecker.compare(appExtensionsVersion, aRemoteItem.minAppVersion) < 0) 
      return false;

    // Check if the update will only run on an older version of Firefox. 
    if (aRemoteItem.maxAppVersion && 
        gVersionChecker.compare(appExtensionsVersion, aRemoteItem.maxAppVersion) > 0) 
      return false;

    if (this._emDS.isBlocklisted(aRemoteItem.id, aRemoteItem.version,
                                 undefined, undefined))
      return false;
    
    return true;
  },
  
  checkForDone: function(item, status) {
    if (this._background &&
        status == nsIAddonUpdateCheckListener.STATUS_UPDATE) {
      var lastupdate = this._emDS.getItemProperty(item.id, "availableUpdateVersion");
      if (lastupdate != item.version)
        gPref.setBoolPref(PREF_UPDATE_NOTIFYUSER, true);
    }
    if (this._listener) {
      try {
        this._listener.onAddonUpdateEnded(item, status);
      }
      catch (e) {
        LOG("ExtensionItemUpdater:checkForDone: Failure in listener's onAddonUpdateEnded: " + e);
      }
    }
    if (--this._responseCount == 0 && this._listener) {
      try {
        this._listener.onUpdateEnded();
      }
      catch (e) {
        LOG("ExtensionItemUpdater:checkForDone: Failure in listener's onUpdateEnded: " + e);
      }
    }
  },
};

function RDFItemUpdater(aUpdater) {
  this._updater = aUpdater;
}

RDFItemUpdater.prototype = {
  _updater            : null,
  _versionUpdateOnly  : 0,
  _item               : null,
  
  checkForUpdates: function(aItem, aVersionUpdateOnly) {
    // A preference setting can disable updating for this item
    try {
      if (!gPref.getBoolPref(PREF_EM_ITEM_UPDATE_ENABLED.replace(/%UUID%/, aItem.id))) {
        var status = nsIAddonUpdateCheckListener.STATUS_DISABLED;
        this._updater.checkForDone(aItem, status);
        return;
      }
    }
    catch (e) { }

    // Items managed by the app are not checked for updates.
    var emDS = this._updater._emDS;
    if (emDS.getItemProperty(aItem.id, "appManaged") == "true") {
      var status = nsIAddonUpdateCheckListener.STATUS_APP_MANAGED;
      this._updater.checkForDone(aItem, status);
      return;
    }

    // Items that have a pending install, uninstall, or upgrade are not checked
    // for updates.
    var opType = emDS.getItemProperty(aItem.id, "opType");
    if (opType == OP_NEEDS_INSTALL || opType == OP_NEEDS_UNINSTALL ||
        opType == OP_NEEDS_UPGRADE) {
      var status = nsIAddonUpdateCheckListener.STATUS_PENDING_OP;
      this._updater.checkForDone(aItem, status);
      return;
    }

    var installLocation = InstallLocations.get(emDS.getInstallLocationKey(aItem.id));
    // Don't check items for updates that are installed in a location that is
    // not managed by the app.
    if (installLocation && (installLocation.name == "winreg-app-global" ||
        installLocation.name == "winreg-app-user")) {
      var status = nsIAddonUpdateCheckListener.STATUS_NOT_MANAGED;
      this._updater.checkForDone(aItem, status);
      return;
    }

    // Don't check items for updates if the location can't be written to except
    // when performing a version only update.
    if (!aVersionUpdateOnly && (!installLocation || !installLocation.canAccess)) {
      var status = nsIAddonUpdateCheckListener.STATUS_READ_ONLY;
      this._updater.checkForDone(aItem, status);
      return;
    }

    this._versionUpdateOnly = aVersionUpdateOnly;
    this._item = aItem;
  
    var itemStatus = "userEnabled";
    if (emDS.getItemProperty(aItem.id, "userDisabled") == "true" ||
        emDS.getItemProperty(aItem.id, "userDisabled") == OP_NEEDS_ENABLE)
      itemStatus = "userDisabled";
    else if (emDS.getItemProperty(aItem.id, "type") == nsIUpdateItem.TYPE_THEME) {
      var currentSkin = gPref.getCharPref(PREF_GENERAL_SKINS_SELECTEDSKIN);
      if (emDS.getItemProperty(aItem.id, "internalName") != currentSkin)
        itemStatus = "userDisabled";
    }
    
    if (emDS.getItemProperty(aItem.id, "compatible") == "false")
      itemStatus += ",incompatible";
    if (emDS.getItemProperty(aItem.id, "blocklisted") == "true")
      itemStatus += ",blocklisted";
    if (emDS.getItemProperty(aItem.id, "satisfiesDependencies") == "false")
      itemStatus += ",needsDependencies";

    // Look for a custom update URI: 1) supplied by a pref, 2) supplied by the
    // install manifest, 3) the default configuration
    try {
      var dsURI = gPref.getComplexValue(PREF_EM_ITEM_UPDATE_URL.replace(/%UUID%/, aItem.id),
                                        Components.interfaces.nsIPrefLocalizedString).data;
    }
    catch (e) { }
    if (!dsURI)
      dsURI = aItem.updateRDF;
    if (!dsURI) {
      dsURI = gPref.getComplexValue(PREF_UPDATE_DEFAULT_URL,
                                    Components.interfaces.nsIPrefLocalizedString).data;
    }
    dsURI = dsURI.replace(/%ITEM_ID%/g, aItem.id);
    dsURI = dsURI.replace(/%ITEM_VERSION%/g, aItem.version);
    dsURI = dsURI.replace(/%ITEM_MAXAPPVERSION%/g, aItem.maxAppVersion);
    dsURI = dsURI.replace(/%ITEM_STATUS%/g, itemStatus);
    dsURI = dsURI.replace(/%APP_ID%/g, this._updater._appID);
    dsURI = dsURI.replace(/%APP_VERSION%/g, this._updater._appVersion);
    dsURI = dsURI.replace(/%REQ_VERSION%/g, 1);
    dsURI = dsURI.replace(/%APP_OS%/g, gOSTarget);
    dsURI = dsURI.replace(/%APP_ABI%/g, gXPCOMABI);
    
    // escape() does not properly encode + symbols in any embedded FVF strings.
    dsURI = dsURI.replace(/\+/g, "%2B");

    // Verify that the URI provided is valid
    try {
      var uri = newURI(dsURI);
    }
    catch (e) {
      LOG("RDFItemUpdater:checkForUpdates: There was an error loading the \r\n" + 
          " update datasource for: " + dsURI + ", item = " + aItem.id + ", error: " + e);
      this._updater.checkForDone(aItem, 
                                 nsIAddonUpdateCheckListener.STATUS_FAILURE);
      return;
    }

    LOG("RDFItemUpdater:checkForUpdates sending a request to server for: " + 
        uri.spec + ", item = " + aItem.objectSource);        

    var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .createInstance(Components.interfaces.nsIXMLHttpRequest);
    request.open("GET", uri.spec, true);
    request.channel.notificationCallbacks = new BadCertHandler();
    request.overrideMimeType("text/xml");
    request.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;

    var self = this;
    request.onerror     = function(event) { self.onXMLError(event, aItem);    };
    request.onload      = function(event) { self.onXMLLoad(event, aItem);     };
    request.send(null);
  },

  onXMLLoad: function(aEvent, aItem) {
    var request = aEvent.target;
    try {
      checkCert(request.channel);
    }
    catch (e) {
      // This may be overly restrictive in two cases: corporate installations
      // with a corporate update server using an in-house CA cert (installed
      // but not "built-in") and lone developers hosting their updates on a
      // site with a self-signed cert (permanently accepted, otherwise the
      // BadCertHandler would prevent getting this far). Update checks will
      // fail in both these scenarios.
      // How else can we protect the vast majority of updates served from AMO
      // from the spoofing attack described in bug 340198 while allowing those
      // other cases? A "hackme" pref? Domain-control certs are cheap, getting
      // one should not be a barrier in either case.
      LOG("RDFItemUpdater::onXMLLoad: " + e);
      this._updater.checkForDone(aItem,
                                 nsIAddonUpdateCheckListener.STATUS_FAILURE);
      return;
    }
    var responseXML = request.responseXML;

    // If the item does not have an update RDF and returns an error it is not
    // treated as a failure since all items without an updateURL are checked
    // for updates on AMO even if they are not hosted there.
    if (!responseXML || responseXML.documentElement.namespaceURI == XMLURI_PARSE_ERROR ||
        (request.status != 200 && request.status != 0)) {
      this._updater.checkForDone(aItem, (aItem.updateRDF ? nsIAddonUpdateCheckListener.STATUS_FAILURE :
                                                           nsIAddonUpdateCheckListener.STATUS_NONE));
      return;
    }

    var rdfParser = Components.classes["@mozilla.org/rdf/xml-parser;1"]
                              .createInstance(Components.interfaces.nsIRDFXMLParser)
    var ds = Components.classes["@mozilla.org/rdf/datasource;1?name=in-memory-datasource"]
                       .createInstance(Components.interfaces.nsIRDFDataSource);
    rdfParser.parseString(ds, request.channel.URI, request.responseText);

    this.onDatasourceLoaded(ds, aItem);
  },

  onXMLError: function(aEvent, aItem) {
    try {
      var request = aEvent.target;
      // the following may throw (e.g. a local file or timeout)
      var status = request.status;
    }
    catch (e) {
      request = aEvent.target.channel.QueryInterface(Components.interfaces.nsIRequest);
      status = request.status;
    }
    // this can fail when a network connection is not present.
    try {
      var statusText = request.statusText;
    }
    catch (e) {
      status = 0;
    }
    // When status is 0 we don't have a valid channel.
    if (status == 0)
      statusText = "nsIXMLHttpRequest channel unavailable";

    LOG("RDFItemUpdater:onError: There was an error loading the \r\n" + 
        "the update datasource for item " + aItem.id + ", error: " + statusText);
    this._updater.checkForDone(aItem, 
                               nsIAddonUpdateCheckListener.STATUS_FAILURE);
  },

  onDatasourceLoaded: function(aDatasource, aLocalItem) {
    ///////////////////////////////////////////////////////////////////////////    
    // The extension update RDF file looks something like this:
    //
    //  <RDF:Description about="urn:mozilla:extension:{GUID}">
    //    <em:updates>
    //      <RDF:Seq>
    //        <RDF:li resource="urn:mozilla:extension:{GUID}:4.9"/>
    //        <RDF:li resource="urn:mozilla:extension:{GUID}:5.0"/>
    //      </RDF:Seq>
    //    </em:updates>
    //    <!-- the version of the extension being offered -->
    //    <em:version>5.0</em:version>
    //    <em:updateLink>http://www.mysite.com/myext-50.xpi</em:updateLink>
    //  </RDF:Description>
    //
    //  <RDF:Description about="urn:mozilla:extension:{GUID}:4.9">
    //    <em:version>4.9</em:version>
    //    <em:targetApplication>
    //      <RDF:Description>
    //        <em:id>{ec8030f7-c20a-464f-9b0e-13a3a9e97384}</em:id>
    //        <em:minVersion>0.9</em:minVersion>
    //        <em:maxVersion>1.0</em:maxVersion>
    //        <em:updateLink>http://www.mysite.com/myext-49.xpi</em:updateLink>
    //      </RDF:Description>
    //    </em:targetApplication>
    //  </RDF:Description>  
    //
    // If we get here because the following happened:
    // 1) User was using Firefox 0.9 with ExtensionX 0.5 (minVersion 0.8, 
    //    maxVersion 0.9 for Firefox)
    // 2) User upgraded Firefox to 1.0
    // 3) |checkForMismatches| deems ExtensionX 0.5 incompatible with this
    //    new version of Firefox on the basis of its maxVersion
    // 4) ** We reach this point **
    //
    // If the version of ExtensionX (0.5) matches that provided by the 
    // server, then this is a cue that the author updated the rdf file
    // or central repository to say "0.5 is ALSO compatible with Firefox 1.0,
    // no changes are necessary." In this event, the local metadata for
    // installed ExtensionX (0.5) is freshened with the new maxVersion, 
    // and we advance to the next item WITHOUT any download/install 
    // updates.
    if (!aDatasource.GetAllResources().hasMoreElements()) {
      LOG("RDFItemUpdater:onDatasourceLoaded: Datasource empty.\r\n" + 
          "If you are an Extension developer and were expecting there to be\r\n" + 
          "updates, this could mean any number of things, since the RDF system\r\n" + 
          "doesn't give up much in the way of information when the load fails.\r\n" + 
          "\r\nTry checking that: \r\n" + 
          " 1. Your remote RDF file exists at the location.\r\n" + 
          " 2. Your RDF file is valid XML (starts with <?xml version=\"1.0?\">\r\n" + 
          "    and loads in Firefox displaying pretty printed like other XML documents\r\n" + 
          " 3. Your server is sending the data in the correct MIME\r\n" + 
          "    type (text/xml)");
    }      
    
  
    // Parse the response RDF
    function UpdateData() {}; 
    UpdateData.prototype = { version: "0.0", updateLink: null, updateHash: null,
                             minVersion: "0.0", maxVersion: "0.0" };
    
    var versionUpdate = new UpdateData();
    var newestUpdate  = new UpdateData();

    var newerItem, sameItem;
    
    // Firefox 1.0PR+ update.rdf format
    if (!this._versionUpdateOnly) {
      // Look for newer versions of this item, we only do this in "normal" 
      // mode... see comment by ExtensionItemUpdater_checkForUpdates 
      // about how we do this in all cases but Install Phone Home - which 
      // only needs to do a version check.
      this._parseV20UpdateInfo(aDatasource, aLocalItem, newestUpdate, false);

      newerItem = makeItem(aLocalItem.id, 
                           newestUpdate.version, 
                           aLocalItem.installLocationKey,
                           newestUpdate.minVersion, 
                           newestUpdate.maxVersion, 
                           aLocalItem.name, 
                           newestUpdate.updateLink,
                           newestUpdate.updateHash,
                           "", /* Icon URL */
                           "", /* RDF Update URL */
                           aLocalItem.type);
      if (this._updater._isValidUpdate(aLocalItem, newerItem))
        ++this._updater._updateCount;
      else
        newerItem = null;
    }
    
    // Now look for updated version compatibility metadata for the currently
    // installed version...
    this._parseV20UpdateInfo(aDatasource, aLocalItem, versionUpdate, true);

    var result = gVersionChecker.compare(versionUpdate.version, 
                                          aLocalItem.version);
    if (result == 0) {
      // Local version exactly matches the "Version Update" remote version, 
      // Apply changes into local datasource.
      sameItem = makeItem(aLocalItem.id, 
                          versionUpdate.version, 
                          aLocalItem.installLocationKey,
                          versionUpdate.minVersion, 
                          versionUpdate.maxVersion, 
                          aLocalItem.name,
                          "", /* XPI Update URL */
                          "", /* XPI Update Hash */
                          "", /* Icon URL */
                          "", /* RDF Update URL */
                          aLocalItem.type);
      if (this._updater._isValidUpdate(aLocalItem, sameItem)) {
        // Install-time updates are not written to the DS because there is no
        // entry yet, EM just uses the notifications to ascertain (by hand)
        // whether or not there is a remote maxVersion tweak that makes the 
        // item being installed compatible.
        if (!this._updater._applyVersionUpdates(aLocalItem, sameItem))
          sameItem = null;
      }
      else 
        sameItem = null;
    }
    
    if (newerItem) {
      LOG("RDFItemUpdater:onDatasourceLoaded: Found a newer version of this item:\r\n" + 
          newerItem.objectSource);
    }
    if (sameItem) {
      LOG("RDFItemUpdater:onDatasourceLoaded: Found info about the installed\r\n" + 
          "version of this item: " + sameItem.objectSource);
    }
    var item = null, status = nsIAddonUpdateCheckListener.STATUS_NONE;
    if (!this._versionUpdateOnly && newerItem) {
      item = newerItem;
      status = nsIAddonUpdateCheckListener.STATUS_UPDATE;
    }
    else if (sameItem) {
      item = sameItem;
      status = nsIAddonUpdateCheckListener.STATUS_VERSIONINFO;
    }
    else {
      item = aLocalItem;
      status = nsIAddonUpdateCheckListener.STATUS_NO_UPDATE;
    }
    // Only one call of this._updater.checkForDone is needed for RDF 
    // responses, since there is only one response per item.
    this._updater.checkForDone(item, status);
  },

  // Get a compulsory property from a resource. Reports an error if the 
  // property was not present. 
  _getPropertyFromResource: function(aDataSource, aSourceResource, aProperty, aLocalItem) {
    var rv;
    try {
      var property = gRDF.GetResource(EM_NS(aProperty));
      rv = stringData(aDataSource.GetTarget(aSourceResource, property, true));
      if (rv === undefined)
        throw Components.results.NS_ERROR_FAILURE;
    }
    catch (e) {
      // XXXben show console message "aProperty" not found on aSourceResource. 
      return null;
    }
    return rv;
  },
  
  // Parses Firefox 1.0RC1+ update.rdf format
  _parseV20UpdateInfo: function(aDataSource, aLocalItem, aUpdateData, aVersionUpdatesOnly) {
    var extensionRes  = gRDF.GetResource(getItemPrefix(aLocalItem.type) + aLocalItem.id);

    var updatesArc = gRDF.GetResource(EM_NS("updates"));
    var updates = aDataSource.GetTarget(extensionRes, updatesArc, true);
    
    try {
      updates = updates.QueryInterface(Components.interfaces.nsIRDFResource);
    }
    catch (e) { 
      LOG("RDFItemUpdater:_parseV20UpdateInfo: No updates were found for:\r\n" + 
          aLocalItem.id + "\r\n" + 
          "If you are an Extension developer and were expecting there to be\r\n" + 
          "updates, this could mean any number of things, since the RDF system\r\n" + 
          "doesn't give up much in the way of information when the load fails.\r\n" + 
          "\r\nTry checking that: \r\n" + 
          " 1. Your RDF File is correct - e.g. check that there is a top level\r\n" + 
          "    RDF Resource with a URI urn:mozilla:extension:{GUID}, and that\r\n" + 
          "    the <em:updates> listed all have matching GUIDs.");
      return; 
    }
    
    var cu = Components.classes["@mozilla.org/rdf/container-utils;1"]
                       .getService(Components.interfaces.nsIRDFContainerUtils);
    if (cu.IsContainer(aDataSource, updates)) {
      var ctr = getContainer(aDataSource, updates);

      // In "all update types" mode, we look for newer versions, starting with the 
      // current installed version.
      if (!aVersionUpdatesOnly) 
        aUpdateData.version = aLocalItem.version;

      var versions = ctr.GetElements();
      while (versions.hasMoreElements()) {
        // There are two different methodologies for collecting version 
        // information depending on whether or not we've bene invoked in 
        // "version updates only" mode or "version+newest" mode. 
        var version = versions.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        this._parseV20Update(aDataSource, version, aLocalItem, aUpdateData, aVersionUpdatesOnly);
        if (aVersionUpdatesOnly && aUpdateData.updateLink)
          break;
      }
    }
  },
  
  _parseV20Update: function(aDataSource, aUpdateResource, aLocalItem, aUpdateData, aVersionUpdatesOnly) {
    var version = this._getPropertyFromResource(aDataSource, aUpdateResource, 
                                                "version", aLocalItem);
    var taArc = gRDF.GetResource(EM_NS("targetApplication"));
    var targetApps = aDataSource.GetTargets(aUpdateResource, taArc, true);
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = this._getPropertyFromResource(aDataSource, targetApp, "id", aLocalItem);
      if (id != this._updater._appID)
        continue;
      
      var result = gVersionChecker.compare(version, aLocalItem.version);
      if (aVersionUpdatesOnly ? result == 0 : result > 0) {
        aUpdateData.version = version;
        aUpdateData.updateLink = this._getPropertyFromResource(aDataSource, targetApp, "updateLink", aLocalItem);
        aUpdateData.updateHash = this._getPropertyFromResource(aDataSource, targetApp, "updateHash", aLocalItem);
        aUpdateData.minVersion = this._getPropertyFromResource(aDataSource, targetApp, "minVersion", aLocalItem);
        aUpdateData.maxVersion = this._getPropertyFromResource(aDataSource, targetApp, "maxVersion", aLocalItem);
      }
    }
  }
};

/**
 * A Datasource that holds Extensions. 
 * - Implements nsIRDFDataSource to drive UI
 * - Uses a RDF/XML datasource for storage (this is undesirable)
 * 
 * @constructor
 */
function ExtensionsDataSource(em) {
  this._em = em;
  
  this._itemRoot = gRDF.GetResource(RDFURI_ITEM_ROOT);
  this._defaultTheme = gRDF.GetResource(RDFURI_DEFAULT_THEME);
  gRDF.RegisterDataSource(this, true);
}
ExtensionsDataSource.prototype = {
  _inner    : null,
  _em       : null,
  _itemRoot     : null,
  _defaultTheme : null,
  
  /**
   * Determines if an item's dependencies are satisfied. An item's dependencies
   * are satisifed when all items specified in the item's em:requires arc are
   * installed, enabled, and the version is compatible based on the em:requires
   * minVersion and maxVersion.
   * @param   id
   *          The ID of the item
   * @returns true if the item's dependencies are satisfied.
   *          false if the item's dependencies are not satisfied.
   */
  satisfiesDependencies: function(id) {
    var ds = this._inner;
    var itemResource = getResourceForID(id);
    var targets = ds.GetTargets(itemResource, EM_R("requires"), true);
    if (!targets.hasMoreElements())
      return true;

    getVersionChecker();
    var idRes = EM_R("id");
    var minVersionRes = EM_R("minVersion");
    var maxVersionRes = EM_R("maxVersion");
    while (targets.hasMoreElements()) {
      var target = targets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var dependencyID = stringData(ds.GetTarget(target, idRes, true));
      var version = null;
      version = this.getItemProperty(dependencyID, "version");
      if (version) {
        var opType = this.getItemProperty(dependencyID, "opType");
        if (opType ==  OP_NEEDS_DISABLE || opType == OP_NEEDS_UNINSTALL)
          return false;

        if (this.getItemProperty(dependencyID, "userDisabled") == "true" ||
            this.getItemProperty(dependencyID, "appDisabled") == "true" ||
            this.getItemProperty(dependencyID, "userDisabled") == OP_NEEDS_DISABLE ||
            this.getItemProperty(dependencyID, "appDisabled") == OP_NEEDS_DISABLE)
          return false;

        var minVersion = stringData(ds.GetTarget(target, minVersionRes, true));
        var maxVersion = stringData(ds.GetTarget(target, maxVersionRes, true));
        var compatible = (gVersionChecker.compare(version, minVersion) >= 0 &&
                          gVersionChecker.compare(version, maxVersion) <= 0);
        if (!compatible)
          return false;
      }
      else {
        return false;
      }
    }

    return true;
  },

  /**
   * Determine if an item is compatible
   * @param   datasource
   *          The datasource to inspect for compatibility - can be the main
   *          datasource or an Install Manifest.
   * @param   source
   *          The RDF Resource of the item to inspect for compatibility.
   * @param   version
   *          The version of the application we are checking for compatibility
   *          against. If this parameter is undefined, the version of the running
   *          application is used.
   * @returns true if the item is compatible with this version of the 
   *          application, false, otherwise.
   */
  isCompatible: function (datasource, source, version) {
    // The Default Theme is always compatible. 
    if (source.EqualsNode(this._defaultTheme))
      return true;

    if (version === undefined) {
      version = gApp.version;
    }              
    var appID = gApp.ID;
    
    var targets = datasource.GetTargets(source, EM_R("targetApplication"), true);
    var idRes = EM_R("id");
    var minVersionRes = EM_R("minVersion");
    var maxVersionRes = EM_R("maxVersion");
    while (targets.hasMoreElements()) {
      var targetApp = targets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id          = stringData(datasource.GetTarget(targetApp, idRes, true));
      var minVersion  = stringData(datasource.GetTarget(targetApp, minVersionRes, true));
      var maxVersion  = stringData(datasource.GetTarget(targetApp, maxVersionRes, true));
      if (id == appID) {
        var versionChecker = getVersionChecker();
        return ((versionChecker.compare(version, minVersion) >= 0) &&
                (versionChecker.compare(version, maxVersion) <= 0));
      }
    }
    return false;
  },

  /**
   * Determine if an item is blocklisted
   * @param   id
   *          The id of the item to check.
   * @param   extVersion
   *          The item's version.
   * @param   appVersion
   *          The version of the application we are checking in the blocklist.
   *          If this parameter is undefined, the version of the running
   *          application is used.
   * @param   toolkitVersion
   *          The version of the toolkit we are checking in the blocklist.
   *          If this parameter is undefined, the version of the running
   *          toolkit is used.
   * @returns true if the item is compatible with this version of the 
   *          application, false, otherwise.
   */
  isBlocklisted: function(id, extVersion, appVersion, toolkitVersion) {
    if (appVersion === undefined)
      appVersion = gApp.version;
    if (toolkitVersion === undefined)
      toolkitVersion = gApp.platformVersion;

    var blItem = Blocklist.entries[id];
    if (!blItem)
      return false;

    var versionChecker = getVersionChecker();
    for (var i = 0; i < blItem.length; ++i) {
      if (versionChecker.compare(extVersion, blItem[i].minVersion) < 0  ||
          versionChecker.compare(extVersion, blItem[i].maxVersion) > 0)
        continue;

      var blTargetApp = blItem[i].targetApps[gApp.ID];
      if (blTargetApp) {
        for (var x = 0; x < blTargetApp.length; ++x) {
          if (versionChecker.compare(appVersion, blTargetApp[x].minVersion) < 0  ||
              versionChecker.compare(appVersion, blTargetApp[x].maxVersion) > 0)
            continue;
          return true;
        }
      }

      blTargetApp = blItem[i].targetApps[TOOLKIT_ID];
      if (!blTargetApp)
        return false;
      for (x = 0; x < blTargetApp.length; ++x) {
        if (versionChecker.compare(toolkitVersion, blTargetApp[x].minVersion) < 0  ||
            versionChecker.compare(toolkitVersion, blTargetApp[x].maxVersion) > 0)
          continue;
        return true;
      }
    }
    return false;
  },

  /**
   * Gets a list of items that are incompatible with a specific application version.
   * @param   appID
   *          The ID of the application - XXXben unused?
   * @param   appVersion
   *          The Version of the application to check for incompatibility against.
   * @param   desiredType
   *          The nsIUpdateItem type of items to look for
   * @param   includeDisabled
   *          Whether or not disabled items should be included in the set returned
   * @returns An array of nsIUpdateItems that are incompatible with the application
   *          ID/Version supplied.
   */
  getIncompatibleItemList: function(appID, appVersion, desiredType, includeDisabled) {
    var items = [];
    var ctr = getContainer(this._inner, this._itemRoot);
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var item = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
      var type = this.getItemProperty(id, "type");
      // Skip this item if we're not seeking disabled items
      if (!includeDisabled && this.getItemProperty(id, "isDisabled") == "true")
        continue;
      
      // If the id of this item matches one of the items potentially installed
      // with and maintained by this application AND it is installed in the 
      // global install location (i.e. the place installed by the app installer)
      // it is and can be managed by the update file - it's not an item that has
      // been manually installed by the user into their profile dir, and as such
      // it is always compatible with the next release of the application since
      // we will continue to support it.
      var locationKey = this.getItemProperty(id, "installLocation");
      var appManaged = this.getItemProperty(id, "appManaged") == "true";
      if (appManaged && locationKey == KEY_APP_GLOBAL)
        continue;

      if (type != -1 && (type & desiredType) && 
          !this.isCompatible(this, item, appVersion))
        items.push(this.getItemForID(id));
    }
    return items;
  },
  
  /**
   * Retrieves a list of items that will be blocklisted by the application for
   * a specific application or toolkit version.
   * @param   appVersion
   *          The Version of the application to check the blocklist against.
   * @param   toolkitVersion
   *          The Version of the toolkit to check the blocklist against.
   * @param   desiredType
   *          The nsIUpdateItem type of items to look for
   * @param   includeAppDisabled
   *          Whether or not items that are or are already set to be disabled
   *          by the app on next restart should be included in the set returned
   * @returns An array of nsIUpdateItems that are blocklisted with the application
   *          or toolkit version supplied.
   */
  getBlocklistedItemList: function(appVersion, toolkitVersion, desiredType,
                                   includeAppDisabled) {
    var items = [];
    var ctr = getContainer(this._inner, this._itemRoot);
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var item = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
      var type = this.getItemProperty(id, "type");

      if (!includeAppDisabled &&
          (this.getItemProperty(id, "appDisabled") == "true" ||
          this.getItemProperty(id, "appDisabled") == OP_NEEDS_DISABLE))
        continue;

      var extVersion = this.getItemProperty(id, "version");
      if (type != -1 && (type & desiredType) && 
          this.isBlocklisted(id, extVersion, appVersion, toolkitVersion))
        items.push(this.getItemForID(id));
    }
    return items;
  },

  /**
   * Gets a list of items of a specific type
   * @param   desiredType
   *          The nsIUpdateItem type of items to return
   * @param   countRef
   *          The XPCJS reference to the size of the returned array
   * @returns An array of nsIUpdateItems, populated only with an item for |id|
   *          if |id| is non-null, otherwise all items matching the specified
   *          type.
   */
  getItemList: function(desiredType, countRef) {
    var items = [];
    var ctr = getContainer(this, this._itemRoot);      
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var e = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var eID = stripPrefix(e.Value, PREFIX_ITEM_URI);
      var type = this.getItemProperty(eID, "type");
      if (type != -1 && type & desiredType)
        items.push(this.getItemForID(eID));
    }
    countRef.value = items.length;
    return items;
  },

  /**
   * Retrieves a list of installed nsIUpdateItems of items that are dependent
   * on another item.
   * @param   id
   *          The ID of the item that other items depend on.
   * @param   includeDisabled
   *          Whether to include disabled items in the set returned.
   * @param   countRef
   *          The XPCJS reference to the number of items returned.
   * @returns An array of installed nsIUpdateItems that depend on the item
   *          specified by the id parameter.
   */
  getDependentItemListForID: function(id, includeDisabled, countRef) {
    var items = [];
    var ds = this._inner;
    var ctr = getContainer(this, this._itemRoot);
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var e = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var dependentID = stripPrefix(e.Value, PREFIX_ITEM_URI);
      var targets = ds.GetTargets(e, EM_R("requires"), true);
      var idRes = EM_R("id");
      while (targets.hasMoreElements()) {
        var target = targets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var dependencyID = stringData(ds.GetTarget(target, idRes, true));
        if (dependencyID == id) {
          if (!includeDisabled && this.getItemProperty(dependentID, "isDisabled") == "true")
            continue;
          items.push(this.getItemForID(dependentID));
          break;
        }
      }
    }
    countRef.value = items.length;
    return items;
  },

  /**
   * Get a list of Item IDs that have a flag set
   * @param   flag
   *          The name of an RDF property (less EM_NS) to check for
   * @param   desiredType
   *          The nsIUpdateItem type of item to look for
   * @returns An array of Item IDs 
   *
   * XXXben - this function is a little weird since it returns an array of 
   *          strings, not an array of nsIUpdateItems...  
   */
  getItemsWithFlagUnset: function(flag, desiredType) {
    var items = [];

    var ctr = getContainer(this, this._itemRoot);    
    var elements = ctr.GetElements();
    while (elements.hasMoreElements()) {
      var e = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = stripPrefix(e.Value, PREFIX_ITEM_URI);
      var type = this.getItemProperty(id, "type");
      if (type != -1 && type & desiredType) {
        var value = this.GetTarget(e, EM_R(flag), true);
        if (!value)
          items.push(id);
      }
    }
    return items;
  },
  
  /**
   * Constructs an nsIUpdateItem for the given item ID
   * @param   id
   *          The GUID of the item to construct a nsIUpdateItem for
   * @returns The nsIUpdateItem for the id.
   */  
  getItemForID: function(id) {
    var r = getResourceForID(id);
    if (!r)
      return null;
    
    var targetAppInfo = this.getTargetApplicationInfo(id, this);
    var updateHash = this.getItemProperty(id, "availableUpdateHash");
    return makeItem(id, 
                    this.getItemProperty(id, "version"), 
                    this.getItemProperty(id, "installLocation"),
                    targetAppInfo ? targetAppInfo.minVersion : "",
                    targetAppInfo ? targetAppInfo.maxVersion : "",
                    this.getItemProperty(id, "name"),
                    this.getItemProperty(id, "availableUpdateURL"),
                    updateHash ? updateHash : "",
                    this.getItemProperty(id, "iconURL"), 
                    this.getItemProperty(id, "updateURL"), 
                    this.getItemProperty(id, "type"));
  },
  
  /**
   * Gets the name of the Install Location where an item is installed.
   * @param   id
   *          The GUID of the item to locate an Install Location for
   * @returns The string name of the Install Location where the item is 
   *          installed.
   */
  getInstallLocationKey: function(id) {
    return this.getItemProperty(id, "installLocation");
  },
  
  /**
   * Sets an RDF property on an item in a datasource. Does not create
   * multiple assertions
   * @param   datasource
   *          The target datasource where the property should be set
   * @param   source
   *          The RDF Resource to set the property on
   * @param   property
   *          The RDF Resource of the property to set
   * @param   newValue
   *          The RDF Node containing the new property value
   */
  _setProperty: function(datasource, source, property, newValue) {
    var oldValue = datasource.GetTarget(source, property, true);
    if (oldValue) {
      if (newValue)
        datasource.Change(source, property, oldValue, newValue);
      else
        datasource.Unassert(source, property, oldValue);
    }
    else if (newValue)
      datasource.Assert(source, property, newValue, true);
  },
  
  /**
   * Sets the target application info for an item in the Extensions
   * datasource and in the item's install manifest if it is installed in a
   * profile's extensions directory, it exists, and we have write access.
   * @param   id
   *          The ID of the item to update target application info for
   * @param   minVersion
   *          The minimum version of the target application that this item can
   *          run in
   * @param   maxVersion
   *          The maximum version of the target application that this item can
   *          run in
   */
  updateTargetAppInfo: function(id, minVersion, maxVersion)
  {
    // Update the Extensions datasource
    this.setTargetApplicationInfo(id, minVersion, maxVersion, null);
  },

  /**
   * Gets the updated target application info if it exists for an item from
   * the Extensions datasource during an installation or upgrade.
   * @param   id
   *          The ID of the item to discover updated target application info for
   * @returns A JS Object with the following properties:
   *          "id"            The id of the item
   *          "minVersion"    The updated minimum version of the target
   *                          application that this item can run in
   *          "maxVersion"    The updated maximum version of the target
   *                          application that this item can run in
   */
  getUpdatedTargetAppInfo: function(id) {
    // The default theme is always compatible so there is never update info.
    if (getResourceForID(id).EqualsNode(this._defaultTheme))
      return null;

    var appID = gApp.ID;
    var r = getResourceForID(id);
    var targetApps = this._inner.GetTargets(r, EM_R("targetApplication"), true);
    if (!targetApps.hasMoreElements())
      targetApps = this._inner.GetTargets(gInstallManifestRoot, EM_R("targetApplication"), true); 
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext();
      if (targetApp instanceof Components.interfaces.nsIRDFResource) {
        try {
          var foundAppID = stringData(this._inner.GetTarget(targetApp, EM_R("id"), true));
          if (foundAppID != appID) // Different target application
            continue;
          var updatedMinVersion = this._inner.GetTarget(targetApp, EM_R("updatedMinVersion"), true);
          var updatedMaxVersion = this._inner.GetTarget(targetApp, EM_R("updatedMaxVersion"), true);
          if (updatedMinVersion && updatedMaxVersion)
            return { id        : id,
                     minVersion: stringData(updatedMinVersion),
                     maxVersion: stringData(updatedMaxVersion) };
          else
            return null;
        }
        catch (e) { 
          continue;
        }
      }
    }
    return null;
  },
  
  /**
   * Sets the updated target application info for an item in the Extensions
   * datasource during an installation or upgrade.
   * @param   id
   *          The ID of the item to set updated target application info for
   * @param   updatedMinVersion
   *          The updated minimum version of the target application that this
   *          item can run in
   * @param   updatedMaxVersion
   *          The updated maximum version of the target application that this
   *          item can run in
   */
  setUpdatedTargetAppInfo: function(id, updatedMinVersion, updatedMaxVersion) {
    // The default theme is always compatible so it is never updated.
    if (getResourceForID(id).EqualsNode(this._defaultTheme))
      return;

    // Version/Dependency Info
    var updatedMinVersionRes = EM_R("updatedMinVersion");
    var updatedMaxVersionRes = EM_R("updatedMaxVersion");

    var appID = gApp.ID;
    var r = getResourceForID(id);
    var targetApps = this._inner.GetTargets(r, EM_R("targetApplication"), true);
    // add updatedMinVersion and updatedMaxVersion for an install else an upgrade
    if (!targetApps.hasMoreElements()) {
      var idRes = EM_R("id");
      var targetRes = getResourceForID(id);
      var property = EM_R("targetApplication");
      var anon = gRDF.GetAnonymousResource();
      this._inner.Assert(anon, idRes, EM_L(appID), true);
      this._inner.Assert(anon, updatedMinVersionRes, EM_L(updatedMinVersion), true);
      this._inner.Assert(anon, updatedMaxVersionRes, EM_L(updatedMaxVersion), true);
      this._inner.Assert(targetRes, property, anon, true);
    }
    else {
      while (targetApps.hasMoreElements()) {
        var targetApp = targetApps.getNext();
        if (targetApp instanceof Components.interfaces.nsIRDFResource) {
          var foundAppID = stringData(this._inner.GetTarget(targetApp, EM_R("id"), true));
          if (foundAppID != appID) // Different target application
            continue;
          this._inner.Assert(targetApp, updatedMinVersionRes, EM_L(updatedMinVersion), true);
          this._inner.Assert(targetApp, updatedMaxVersionRes, EM_L(updatedMaxVersion), true);
          break;
        }
      }
    }
    this.Flush();
  },

  /**
   * Gets the target application info for an item from a datasource.
   * @param   id
   *          The GUID of the item to discover target application info for
   * @param   datasource
   *          The datasource to look up target application info in
   * @returns A JS Object with the following properties:
   *          "minVersion"    The minimum version of the target application
   *                          that this item can run in
   *          "maxVersion"    The maximum version of the target application
   *                          that this item can run in
   *          or null, if no target application data exists for the specified
   *          id in the supplied datasource.
   */
  getTargetApplicationInfo: function(id, datasource) {
    // The default theme is always compatible. 
    if (getResourceForID(id).EqualsNode(this._defaultTheme)) {
      var ver = gApp.version;
      return { minVersion: ver, maxVersion: ver };
    }
    var appID = gApp.ID;
    var r = getResourceForID(id);
    var targetApps = datasource.GetTargets(r, EM_R("targetApplication"), true);
    if (!targetApps)
      return null;
    if (!targetApps.hasMoreElements())
      targetApps = datasource.GetTargets(gInstallManifestRoot, EM_R("targetApplication"), true); 
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext();
      if (targetApp instanceof Components.interfaces.nsIRDFResource) {
        try {
          var foundAppID = stringData(datasource.GetTarget(targetApp, EM_R("id"), true));
          if (foundAppID != appID) // Different target application
            continue;
          
          return { minVersion: stringData(datasource.GetTarget(targetApp, EM_R("minVersion"), true)),
                   maxVersion: stringData(datasource.GetTarget(targetApp, EM_R("maxVersion"), true)) };
        }
        catch (e) { 
          continue;
        }
      }
    }
    return null;
  },
  
  /**
   * Sets the target application info for an item in a datasource.
   * @param   id
   *          The GUID of the item to discover target application info for
   * @param   minVersion
   *          The minimum version of the target application that this item can
   *          run in
   * @param   maxVersion
   *          The maximum version of the target application that this item can
   *          run in
   * @param   datasource
   *          The datasource to loko up target application info in
   */
  setTargetApplicationInfo: function(id, minVersion, maxVersion, datasource) {
    var targetDataSource = datasource;
    if (!targetDataSource)
      targetDataSource = this._inner;
      
    var appID = gApp.ID;
    var r = getResourceForID(id);
    var targetApps = targetDataSource.GetTargets(r, EM_R("targetApplication"), true);
    if (!targetApps.hasMoreElements())
      targetApps = datasource.GetTargets(gInstallManifestRoot, EM_R("targetApplication"), true); 
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext();
      if (targetApp instanceof Components.interfaces.nsIRDFResource) {
        var foundAppID = stringData(targetDataSource.GetTarget(targetApp, EM_R("id"), true));
        if (foundAppID != appID) // Different target application
          continue;
        
        this._setProperty(targetDataSource, targetApp, EM_R("minVersion"), EM_L(minVersion));
        this._setProperty(targetDataSource, targetApp, EM_R("maxVersion"), EM_L(maxVersion));
        
        // If we were setting these properties on the main datasource, flush
        // it now. (Don't flush changes set on Install Manifests - they are
        // fleeting).
        if (!datasource)
          this.Flush();

        break;
      }
    }
  },
  
  /** 
   * Gets a property of an item
   * @param   id
   *          The GUID of the item
   * @param   property
   *          The name of the property (excluding EM_NS)
   * @returns The literal value of the property, or undefined if there is no 
   *          value.
   */
  getItemProperty: function(id, property) { 
    var item = getResourceForID(id);
    if (!item) {
      LOG("getItemProperty failing for lack of an item. This means getResourceForItem \
           failed to locate a resource for aItemID (item ID = " + id + ", property = " + property + ")");
    }
    else 
      return this._getItemProperty(item, property);
    return undefined;
  },
  
  /**
   * Gets a property of an item resource
   * @param   itemResource
   *          The RDF Resource of the item
   * @param   property
   *          The name of the property (excluding EM_NS)
   * @returns The literal value of the property, or undefined if there is no
   *          value.
   */
  _getItemProperty: function(itemResource, property) {
    var target = this.GetTarget(itemResource, EM_R(property), true);
    var value = stringData(target);
    if (value === undefined)
      value = intData(target);
    return value === undefined ? "" : value;
  },
  
  /**
   * Sets a property on an item.
   * @param   id
   *          The GUID of the item
   * @param   propertyArc
   *          The RDF Resource of the property arc
   * @param   propertyValue
   *          A nsIRDFLiteral value of the property to be set
   */
  setItemProperty: function (id, propertyArc, propertyValue) {
    var item = getResourceForID(id);
    this._setProperty(this._inner, item, propertyArc, propertyValue);
    this.Flush();  
  },

  /**
   * Inserts the RDF resource for an item into a container.
   * @param   id
   *          The GUID of the item
   */
  insertItemIntoContainer: function(id) {
    // Get the target container and resource
    var ctr = getContainer(this._inner, this._itemRoot);
    var itemResource = getResourceForID(id);
    // Don't bother adding the extension to the list if it's already there. 
    // (i.e. we're upgrading)
    var oldIndex = ctr.IndexOf(itemResource);
    if (oldIndex == -1)
      ctr.AppendElement(itemResource);
    this.Flush();
  }, 

  /**
   * Removes the RDF resource for an item from its container.
   * @param   id
   *          The GUID of the item
   */
  removeItemFromContainer: function(id) {
    var ctr = getContainer(this._inner, this._itemRoot);
    var itemResource = getResourceForID(id);
    ctr.RemoveElement(itemResource, true);
    this.Flush();
  },

  /**
   * Removes a corrupt item entry from the extension list added due to buggy 
   * code in previous EM versions!  
   * @param   id
   *          The GUID of the item
   */
  removeCorruptItem: function(id) {
    this.removeItemMetadata(id);
    this.removeItemFromContainer(id);
  },

  /**
   * Removes a corrupt download entry from the list
   * @param   uri
   *          The RDF URI of the item.
   * @returns The RDF Resource of the removed entry 
   */
  removeCorruptDLItem: function(uri) {
    var itemResource = gRDF.GetResource(uri);
    var ctr = getContainer(this._inner, this._itemRoot);
    if (ctr.IndexOf(itemResource) != -1) {
      ctr.RemoveElement(itemResource, true);
      this._cleanResource(itemResource);
      this.Flush();
    }
    return itemResource;
  },
  
  /**
   * Copies metadata from an Install Manifest Datasource into the Extensions
   * DataSource.
   * @param   id
   *          The GUID of the item
   * @param   installManifest
   *          The Install Manifest datasource we are copying from
   * @param   installLocation
   *          The Install Location of the item. 
   */
  addItemMetadata: function(id, installManifest, installLocation) {
    // Copy the assertions over from the source datasource. 
    var targetRes = getResourceForID(id);
    // Assert properties with single values
    var singleProps = ["version", "name", "description", "creator", "homepageURL", 
                       "updateURL", "updateService", "optionsURL", "aboutURL", 
                       "iconURL", "internalName"];

    // Items installed into restricted Install Locations can also be locked 
    // (can't be removed or disabled), and hidden (not shown in the UI)
    if (installLocation.restricted)
      singleProps = singleProps.concat(["locked", "hidden"]);
    if (installLocation.name == KEY_APP_GLOBAL) 
      singleProps = singleProps.concat(["appManaged"]);
    for (var i = 0; i < singleProps.length; ++i) {
      var property = EM_R(singleProps[i]);
      var literal = installManifest.GetTarget(gInstallManifestRoot, property, true);
      // If literal is null, _setProperty will remove any existing.
      this._setProperty(this._inner, targetRes, property, literal);
    }    
    
    // Assert properties with multiple values    
    var manyProps = ["developer", "translator", "contributor"];
    for (var i = 0; i < manyProps.length; ++i) {
      var property = EM_R(manyProps[i]);
      var literals = installManifest.GetTargets(gInstallManifestRoot, property, true);
      
      var oldValues = this._inner.GetTargets(targetRes, property, true);
      while (oldValues.hasMoreElements()) {
        var oldValue = oldValues.getNext().QueryInterface(Components.interfaces.nsIRDFNode);
        this._inner.Unassert(targetRes, property, oldValue);
      }
      while (literals.hasMoreElements()) {
        var literal = literals.getNext().QueryInterface(Components.interfaces.nsIRDFNode);
        this._inner.Assert(targetRes, property, literal, true);
      }
    }

    // Version/Dependency Info
    var versionProps = ["targetApplication", "requires"];
    var idRes = EM_R("id");
    var minVersionRes = EM_R("minVersion");
    var maxVersionRes = EM_R("maxVersion");
    for (var i = 0; i < versionProps.length; ++i) {
      var property = EM_R(versionProps[i]);
      var newVersionInfos = installManifest.GetTargets(gInstallManifestRoot, property, true);

      var oldVersionInfos = this._inner.GetTargets(targetRes, property, true);
      while (oldVersionInfos.hasMoreElements()) {
        var oldVersionInfo = oldVersionInfos.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        this._cleanResource(oldVersionInfo);
        this._inner.Unassert(targetRes, property, oldVersionInfo);
      }
      while (newVersionInfos.hasMoreElements()) {
        var newVersionInfo = newVersionInfos.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var anon = gRDF.GetAnonymousResource();
        this._inner.Assert(anon, idRes, installManifest.GetTarget(newVersionInfo, idRes, true), true);
        this._inner.Assert(anon, minVersionRes, installManifest.GetTarget(newVersionInfo, minVersionRes, true), true);
        this._inner.Assert(anon, maxVersionRes, installManifest.GetTarget(newVersionInfo, maxVersionRes, true), true);
        this._inner.Assert(targetRes, property, anon, true);
      }
    }
    this.updateProperty(id, "opType");
    this.updateProperty(id, "updateable");
    this.Flush();
  },
  
  /**
   * Strips an item entry of all assertions.
   * @param   id
   *          The GUID of the item
   */
  removeItemMetadata: function(id) {
    var item = getResourceForID(id);
    var resources = ["targetApplication", "requires"];
    for (var i = 0; i < resources.length; ++i) {
      var targetApps = this._inner.GetTargets(item, EM_R(resources[i]), true);
      while (targetApps.hasMoreElements()) {
        var targetApp = targetApps.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        this._cleanResource(targetApp);
      }
    }

    this._cleanResource(item);
  },
  
  /**
   * Strips a resource of all outbound assertions. We use methods like this 
   * since the RDFXMLDatasource will write out all assertions, even if they
   * are not connected through our root. 
   * @param   resource
   *          The resource to clean. 
   */
  _cleanResource: function(resource) {
    // Remove outward arcs
    var arcs = this._inner.ArcLabelsOut(resource);
    while (arcs.hasMoreElements()) {
      var arc = arcs.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var targets = this._inner.GetTargets(resource, arc, true);
      while (targets.hasMoreElements()) {
        var value = targets.getNext().QueryInterface(Components.interfaces.nsIRDFNode);
        if (value)
          this._inner.Unassert(resource, arc, value);
      }
    }
  },
  
  /**
   * Notify views that this propery has changed (this is for properties that
   * are implemented by this datasource rather than by the inner in-memory
   * datasource and thus do not get free change handling).
   * @param   id 
   *          The GUID of the item to update the property for.
   * @param   property
   *          The property (less EM_NS) to update.
   */
  updateProperty: function(id, property) {
    var item = getResourceForID(id);
    this._updateProperty(item, property);
  },
  
  /**
   * Notify views that this propery has changed (this is for properties that
   * are implemented by this datasource rather than by the inner in-memory
   * datasource and thus do not get free change handling). This allows updating
   * properties for download items which don't have the em item prefix in there
   ( resource value. In most instances updateProperty should be used.
   * @param   item
   *          The item to update the property for.
   * @param   property
   *          The property (less EM_NS) to update.
   */
  _updateProperty: function(item, property) {
    var propertyResource = EM_R(property);
    var value = this.GetTarget(item, propertyResource, true);
    if (item && value) {
      for (var i = 0; i < this._observers.length; ++i)
        this._observers[i].onChange(this, item, propertyResource, 
                                    EM_L(""), value);
    }
  },
  
  /**
   * Move an Item to the index of another item in its container.
   * @param   movingID
   *          The ID of the item to be moved.
   * @param   destinationID
   *          The ID of an item to move another item to.
   */
  moveToIndexOf: function(movingID, destinationID) {
    var extensions = gRDF.GetResource(RDFURI_ITEM_ROOT);
    var ctr = getContainer(this._inner, extensions);
    var item = gRDF.GetResource(movingID);
    var index = ctr.IndexOf(gRDF.GetResource(destinationID));
    if (index == -1)
      index = 1; // move to the beginning if destinationID is not found
    this._inner.beginUpdateBatch();
    ctr.RemoveElement(item, true);
    ctr.InsertElementAt(item, index, true);
    this._inner.endUpdateBatch();
    this.Flush();
  },

  /**
   * Sorts addons of the specified type by the specified property starting from
   * the top of their container. If the addons are already sorted then no action
   * is performed.
   * @param   type
   *          The nsIUpdateItem type of the items to sort.
   * @param   propertyName
   *          The RDF property name used for sorting.
   * @param   isAscending
   *          true to sort ascending and false to sort descending
   */
  sortTypeByProperty: function(type, propertyName, isAscending) {
    var items = [];
    var ctr = getContainer(this._inner, this._itemRoot);
    var elements = ctr.GetElements();
    // Base 0 ordinal for checking against the existing order after sorting
    var ordinal = 0;
    while (elements.hasMoreElements()) {
      var item = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
      var itemType = this.getItemProperty(id, "type");
      if (itemType & type) {
        items.push({ item   : item,
                     ordinal: ordinal,
                     sortkey: this.getItemProperty(id, propertyName).toLowerCase() });
        ordinal++;
      }
    }

    var direction = isAscending ? 1 : -1; 
    // Case insensitive sort
    function compare(a, b) {
        if (a.sortkey < b.sortkey) return (-1 * direction);
        if (a.sortkey > b.sortkey) return (1 * direction);
        return 0;
    }
    items.sort(compare);

    // Check if there are any changes in the order of the items
    var isDirty = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].ordinal != i) {
        isDirty = true;
        break;
      }
    }

    // If there are no changes then early return to avoid the perf impact
    if (!isDirty)
      return;

    // Reorder the items by moving them to the top of the container
    this.beginUpdateBatch();
    for (i = 0; i < items.length; i++) {
      ctr.RemoveElement(items[i].item, true);
      ctr.InsertElementAt(items[i].item, i + 1, true);
    }
    this.endUpdateBatch();
    this.Flush();
  },

  /**
   * Determines if an Item is an active download
   * @param   id
   *          The ID of the item. This will be a uri scheme without the
   *          em item prefix so getProperty shouldn't be used.
   * @returns true if the item is an active download, false otherwise.
   */
  isDownloadItem: function(id) {
    var downloadURL = stringData(this.GetTarget(gRDF.GetResource(id), EM_R("downloadURL"), true));
    return downloadURL && downloadURL != "";
  },

  /**
   * Adds an entry representing an active download to the appropriate container
   * @param   addon
   *          An object implementing nsIUpdateItem for the addon being 
   *          downloaded.
   */
  addDownload: function(addon) {
    // Updates have already been added to the datasource so we just update the
    // download state.
    if (addon.id != addon.xpiURL) {
      this.updateDownloadState(PREFIX_ITEM_URI + addon.id, "waiting");
      return;
    }
    var res = gRDF.GetResource(addon.xpiURL);
    this._setProperty(this._inner, res, EM_R("name"), EM_L(addon.name));
    this._setProperty(this._inner, res, EM_R("version"), EM_L(addon.version));
    this._setProperty(this._inner, res, EM_R("iconURL"), EM_L(addon.iconURL));
    this._setProperty(this._inner, res, EM_R("downloadURL"), EM_L(addon.xpiURL));
    this._setProperty(this._inner, res, EM_R("type"), EM_I(addon.type));

    var ctr = getContainer(this._inner, this._itemRoot);
    if (ctr.IndexOf(res) == -1)
      ctr.AppendElement(res);
    
    this.updateDownloadState(addon.xpiURL, "waiting");
    this.Flush();
  },
  
  /**
   * Adds an entry representing an item that is incompatible and is being
   * checked for a compatibility update.
   * @param   name
   *          The display name of the item being checked
   * @param   url
   *          The URL string of the xpi file that has been staged.
   * @param   type
   *          The nsIUpdateItem type of the item
   * @param   version
   *          The version of the item
   */
  addIncompatibleUpdateItem: function(name, url, type, version) {
    var iconURL = (type == nsIUpdateItem.TYPE_THEME) ? URI_GENERIC_ICON_THEME :
                                                       URI_GENERIC_ICON_XPINSTALL;
    var extensionsStrings = BundleManager.getBundle(URI_EXTENSIONS_PROPERTIES);
    var updateMsg = extensionsStrings.formatStringFromName("incompatibleUpdateMessage",
                                                           [BundleManager.appName, name], 2)

    var res = gRDF.GetResource(url);
    this._setProperty(this._inner, res, EM_R("name"), EM_L(name));
    this._setProperty(this._inner, res, EM_R("iconURL"), EM_L(iconURL));
    this._setProperty(this._inner, res, EM_R("downloadURL"), EM_L(url));
    this._setProperty(this._inner, res, EM_R("type"), EM_I(type));
    this._setProperty(this._inner, res, EM_R("version"), EM_L(version));
    this._setProperty(this._inner, res, EM_R("incompatibleUpdate"), EM_L("true"));
    this._setProperty(this._inner, res, EM_R("description"), EM_L(updateMsg));

    var ctr = getContainer(this._inner, this._itemRoot);
    if (ctr.IndexOf(res) == -1)
      ctr.AppendElement(res);

    this.updateDownloadState(url, "incompatibleUpdate");
    this.Flush();
  },

  /**
   * Removes an active download from the appropriate container
   * @param   url
   *          The URL string of the active download to be removed
   */
  removeDownload: function(url) {
    var res = gRDF.GetResource(url);
    var ctr = getContainer(this._inner, this._itemRoot);
    if (ctr.IndexOf(res) != -1) 
      ctr.RemoveElement(res, true);
    this._cleanResource(res);
    this.updateDownloadState(url, null);
    this.Flush();
  },
  
  /**
   * A hash of RDF resource values (e.g. Add-on IDs or XPI URLs) that represent
   * installation progress for a single browser session.
   */
  _progressData: { },

  /**
   * Updates the install progress data for a given ID (e.g. Add-on IDs or
   * XPI URLs).
   * @param   id
   *          The URL string of the active download to be removed
   * @param   state
   *          The current state in the installation process. If null the object
   *          is deleted from _progressData.
   */
  updateDownloadState: function(id, state) {
    if (!state) {
      if (id in this._progressData)
        delete this._progressData[id];
      return;
    }
    else {
      if (!(id in this._progressData)) 
        this._progressData[id] = { };
      this._progressData[id].state = state;
    }
    var item = gRDF.GetResource(id);
    this._updateProperty(item, "state");
  },

  updateDownloadProgress: function(id, progress) {
    if (!progress) {
      if (!(id in this._progressData))
        return;
      this._progressData[id].progress = null;
    }
    else {
      if (!(id in this._progressData))
        this.updateDownloadState(id, "downloading");

      if (this._progressData[id].progress == progress)
        return;

      this._progressData[id].progress = progress;
    }
    var item = gRDF.GetResource(id);
    this._updateProperty(item, "progress");
  },

  /**
   * A GUID->location-key hash of items that are visible to the application.
   * These are items that show up in the Extension/Themes etc UI. If there is
   * an instance of the same item installed in Install Locations of differing 
   * profiles, the item at the highest priority location will appear in this 
   * list.
   */
  visibleItems: { },
  
  /**
   * Walk the list of installed items and determine what the visible list is, 
   * based on which items are visible at the highest priority locations. 
   */  
  _buildVisibleItemList: function() {
    var ctr = getContainer(this, this._itemRoot);
    var items = ctr.GetElements();
    while (items.hasMoreElements()) {
      var item = items.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      // Resource URIs adopt the format: location-key,item-id
      var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
      this.visibleItems[id] = this.getItemProperty(id, "installLocation");
    }
  },
  
  /**
   * Updates an item's location in the visible item list.
   * @param   id
   *          The GUID of the item to update
   * @param   locationKey
   *          The name of the Install Location where the item is installed.
   * @param   forceReplace
   *          true if the new location should be used, regardless of its 
   *          priority relationship to existing entries, false if the location
   *          should only be updated if its priority is lower than the existing
   *          value.
   */
  updateVisibleList: function(id, locationKey, forceReplace) {
    if (id in this.visibleItems && this.visibleItems[id]) {
      var oldLocation = InstallLocations.get(this.visibleItems[id]);
      var newLocation = InstallLocations.get(locationKey);
      if (forceReplace || newLocation.priority < oldLocation.priority) 
        this.visibleItems[id] = locationKey;
    }
    else 
      this.visibleItems[id] = locationKey;
  },

  /**
   * Load the Extensions Datasource from disk.
   */
  loadExtensions: function() {
    Blocklist._ensureBlocklist();
    var extensionsFile  = getFile(KEY_PROFILEDIR, [FILE_EXTENSIONS]);
    try {
      this._inner = gRDF.GetDataSourceBlocking(getURLSpecFromFile(extensionsFile));
    }
    catch (e) {
      LOG("Datasource::loadExtensions: removing corrupted extensions datasource " +
          " file = " + extensionsFile.path + ", exception = " + e + "\n");
      extensionsFile.remove(false);
      return;
    }

    var cu = Components.classes["@mozilla.org/rdf/container-utils;1"]
                       .getService(Components.interfaces.nsIRDFContainerUtils);
    cu.MakeSeq(this._inner, this._itemRoot);

    this._buildVisibleItemList();
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  onUpdateStarted: function() {
    LOG("Datasource: Update Started");
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  onUpdateEnded: function() {
    LOG("Datasource: Update Ended");
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  onAddonUpdateStarted: function(addon) {
    LOG("Datasource: Addon Update Started: " + addon.id);
    this.updateProperty(addon.id, "availableUpdateURL");
  },
  
  /**
   * See nsIExtensionManager.idl
   */
  onAddonUpdateEnded: function(addon, status) {
    LOG("Datasource: Addon Update Ended: " + addon.id + ", status: " + status);
    var url = null, hash = null, version = null;
    var updateAvailable = status == nsIAddonUpdateCheckListener.STATUS_UPDATE;
    if (updateAvailable) {
      url = EM_L(addon.xpiURL);
      if (addon.xpiHash)
        hash = EM_L(addon.xpiHash);
      version = EM_L(addon.version);
    }
    this.setItemProperty(addon.id, EM_R("availableUpdateURL"), url);
    this.setItemProperty(addon.id, EM_R("availableUpdateHash"), hash);
    this.setItemProperty(addon.id, EM_R("availableUpdateVersion"), version);
    this.updateProperty(addon.id, "availableUpdateURL");
  },

  /////////////////////////////////////////////////////////////////////////////
  // nsIRDFDataSource
  get URI() {
    return "rdf:extensions";
  },
  
  GetSource: function(property, target, truthValue) {
    return this._inner.GetSource(property, target, truthValue);
  },
  
  GetSources: function(property, target, truthValue) {
    return this._inner.GetSources(property, target, truthValue);
  },
  
  /**
   * Gets an URL to a theme's image file
   * @param   item
   *          The RDF Resource representing the item 
   * @param   fileName
   *          The file to locate a URL for
   * @param   fallbackURL
   *          If the location fails, supply this URL instead
   * @returns An RDF Resource to the URL discovered, or the fallback
   *          if the discovery failed. 
   */
  _getThemeImageURL: function(item, fileName, fallbackURL) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var installLocation = this._em.getInstallLocation(id);
    var file = installLocation.getItemFile(id, fileName)
    if (file.exists())
      return gRDF.GetResource(getURLSpecFromFile(file));

    if (id == stripPrefix(RDFURI_DEFAULT_THEME, PREFIX_ITEM_URI)) {
      var jarFile = getFile(KEY_APPDIR, [DIR_CHROME, FILE_DEFAULT_THEME_JAR]);
      var url = "jar:" + getURLSpecFromFile(jarFile) + "!/" + fileName;
      return gRDF.GetResource(url);
    }

    return fallbackURL ? gRDF.GetResource(fallbackURL) : null;
  },

  /**
   * Get the em:iconURL property (icon url of the item)
   */
  _rdfGet_iconURL: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var type = this.getItemProperty(id, "type");
    if (type & nsIUpdateItem.TYPE_THEME)
      return this._getThemeImageURL(item, "icon.png", URI_GENERIC_ICON_THEME);

    if (inSafeMode())
      return gRDF.GetResource(URI_GENERIC_ICON_XPINSTALL);

    var hasIconURL = this._inner.hasArcOut(item, property);
    // If the addon doesn't have an IconURL property or it is disabled use the
    // generic icon URL instead.
    if (!hasIconURL || this.getItemProperty(id, "isDisabled") == "true")
      return gRDF.GetResource(URI_GENERIC_ICON_XPINSTALL);
    var iconURL = stringData(this._inner.GetTarget(item, property, true));
    try {
      var uri = newURI(iconURL);
      var scheme = uri.scheme;
      // Only allow chrome URIs or when installing http(s) URIs.
      if (scheme == "chrome" || (scheme == "http" || scheme == "https") &&
          this._inner.hasArcOut(item, EM_R("downloadURL")))
        return null;
    }
    catch (e) {
    }
    // Use a generic icon URL for addons that have an invalid iconURL.
    return gRDF.GetResource(URI_GENERIC_ICON_XPINSTALL);
  },
  
  /**
   * Get the em:previewImage property (preview image of the item)
   */
  _rdfGet_previewImage: function(item, property) {
    var type = this.getItemProperty(stripPrefix(item.Value, PREFIX_ITEM_URI), "type");
    if (type != -1 && type & nsIUpdateItem.TYPE_THEME)
      return this._getThemeImageURL(item, "preview.png", null);
    return null;
  },
  
  /**
   * If we're in safe mode, the item is disabled by the user or app, or the
   * item is to be upgraded force the generic about dialog for the item.
   */
  _rdfGet_aboutURL: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    if (inSafeMode() || this.getItemProperty(id, "isDisabled") == "true" ||
        this.getItemProperty(id, "opType") == OP_NEEDS_UPGRADE)
      return EM_L("");

    return null;
  },

  _rdfGet_installDate: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var key = this.getItemProperty(id, "installLocation");
    if (key && key in StartupCache.entries && id in StartupCache.entries[key] &&
        StartupCache.entries[key][id] && StartupCache.entries[key][id].mtime)
      return EM_D(StartupCache.entries[key][id].mtime * 1000000);
    return null;
  },

  /**
   * Get the em:compatible property (whether or not this item is compatible)
   */
  _rdfGet_compatible: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var targetAppInfo = this.getTargetApplicationInfo(id, this);
    if (!targetAppInfo) {
      // When installing a new addon targetAppInfo does not exist yet
      if (this.getItemProperty(id, "opType") == OP_NEEDS_INSTALL)
        return EM_L("true");
      return EM_L("false");
    }
    
    getVersionChecker();
    var appVersion = gApp.version;
    if (gVersionChecker.compare(targetAppInfo.maxVersion, appVersion) < 0 || 
        gVersionChecker.compare(appVersion, targetAppInfo.minVersion) < 0) {
      // OK, this item is incompatible. 
      return EM_L("false");
    }
    return EM_L("true");
  }, 

  /**
   * Get the em:blocklisted property (whether or not this item is blocklisted)
   */
  _rdfGet_blocklisted: function(item, property) {
    Blocklist._ensureBlocklist();
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var blItem = Blocklist.entries[id];
    if (!blItem)
      return EM_L("false");

    getVersionChecker();
    var version = this.getItemProperty(id, "version");
    var appVersion = gApp.version;
    for (var i = 0; i < blItem.length; ++i) {
      if (gVersionChecker.compare(version, blItem[i].minVersion) < 0  ||
          gVersionChecker.compare(version, blItem[i].maxVersion) > 0)
        continue;

      var blTargetApp = blItem[i].targetApps[gApp.ID];
      if (blTargetApp) {
        for (var x = 0; x < blTargetApp.length; ++x) {
          if (gVersionChecker.compare(appVersion, blTargetApp[x].minVersion) < 0  ||
              gVersionChecker.compare(appVersion, blTargetApp[x].maxVersion) > 0)
            continue;
          return EM_L("true");
        }
      }

      blTargetApp = blItem[i].targetApps[TOOLKIT_ID];
      if (!blTargetApp)
        return EM_L("false");
      for (x = 0; x < blTargetApp.length; ++x) {
        if (gVersionChecker.compare(gApp.platformVersion, blTargetApp[x].minVersion) < 0  ||
            gVersionChecker.compare(gApp.platformVersion, blTargetApp[x].maxVersion) > 0)
          continue;
        return EM_L("true");
      }
    }
    return EM_L("false");
  }, 
  
  /**
   * Get the em:state property (represents the current phase of an install).
   */
  _rdfGet_state: function(item, property) {
    var id = item.Value;
    if (id in this._progressData)
      return EM_L(this._progressData[id].state);
    return null;
  },

  /**
   * Get the em:progress property from the _progressData js object. By storing
   * progress which is updated repeastedly during a download we avoid
   * repeastedly writing it to the rdf file.
   */
  _rdfGet_progress: function(item, property) {
    var id = item.Value;
    if (id in this._progressData)
      return EM_I(this._progressData[id].progress);
    return null;
  },

  /**
   * Get the em:appManaged property. This prevents extensions from hiding
   * extensions installed into locations other than the app-global location.
   */
  _rdfGet_appManaged: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var locationKey = this.getItemProperty(id, "installLocation");
    if (locationKey != KEY_APP_GLOBAL)
      return EM_L("false");
    return null;
  },

  /**
   * Get the em:hidden property. This prevents extensions from hiding
   * extensions installed into locations other than restricted locations.
   */
  _rdfGet_hidden: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var installLocation = InstallLocations.get(this.getInstallLocationKey(id));
    if (!installLocation || !installLocation.restricted)
      return EM_L("false");
    return null;
  },

  /**
   * Get the em:locked property. This prevents extensions from locking
   * extensions installed into locations other than restricted locations.
   */
  _rdfGet_locked: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var installLocation = InstallLocations.get(this.getInstallLocationKey(id));
    if (!installLocation || !installLocation.restricted)
      return EM_L("false");
    return null;
  },

  /** 
   * Gets the em:availableUpdateURL - the URL to an XPI update package, if
   * present, or a literal string "none" if there is no update XPI URL.
   * XXXrstrong we return none due to bug 331689 
   */
  _rdfGet_availableUpdateURL: function(item, property) {
    var value = this._inner.GetTarget(item, property, true);
    if (!value) 
      return EM_L("none");
    return value;
  },

  /**
   * Get the em:satisfiesDependencies property - literal string "false" for
   * dependencies not satisfied (e.g. dependency disabled, incorrect version,
   * not installed etc.), and literal string "true" for dependencies satisfied.
   */
  _rdfGet_satisfiesDependencies: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    if (this.satisfiesDependencies(id))
      return EM_L("true");
    return EM_L("false");
  },
  
  /**
   * Get the em:opType property (controls widget state for the EM UI)
   * from the Startup Cache (e.g. extensions.cache)
   * XXXrstrong we return none for OP_NONE due to bug 331689 
   */
  _rdfGet_opType: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var key = this.getItemProperty(id, "installLocation");
    if (key in StartupCache.entries && id in StartupCache.entries[key] &&
        StartupCache.entries[key][id] && StartupCache.entries[key][id].op != OP_NONE)
      return EM_L(StartupCache.entries[key][id].op);
    return EM_L("none");
  },

  /**
   * Gets a localizable property. Install Manifests are generally only in one 
   * language, however an item can customize by providing localized prefs in 
   * the form:
   *
   *    extensions.{GUID}.[name|description|creator|homepageURL]
   *
   * to specify localized text for each of these properties.
   */
  _getLocalizablePropertyValue: function(item, property) {
    // These are localizable properties that a language pack supplied by the 
    // Extension may override.          
    var prefName = PREF_EM_EXTENSION_FORMAT.replace(/%UUID%/, 
                    stripPrefix(item.Value, PREFIX_ITEM_URI)) + 
                    stripPrefix(property.Value, PREFIX_NS_EM);
    try {
      var value = gPref.getComplexValue(prefName, 
                                        Components.interfaces.nsIPrefLocalizedString);
      if (value.data) 
        return EM_L(value.data);
    }
    catch (e) {
    }
    return null;
  },
  
  /**
   * Get the em:name property (name of the item)
   */
  _rdfGet_name: function(item, property) {
    return this._getLocalizablePropertyValue(item, property);
  },
  
  /**
   * Get the em:description property (description of the item)
   */
  _rdfGet_description: function(item, property) {
    return this._getLocalizablePropertyValue(item, property);
  },
  
  /**
   * Get the em:creator property (creator of the item)
   */
  _rdfGet_creator: function(item, property) { 
    return this._getLocalizablePropertyValue(item, property);
  },
  
  /**
   * Get the em:homepageURL property (homepage URL of the item)
   */
  _rdfGet_homepageURL: function(item, property) {
    return this._getLocalizablePropertyValue(item, property);
  },

  /**
   * Get the em:isDisabled property. This will be true if the item has a
   * appDisabled or a userDisabled property that is true or OP_NEEDS_ENABLE.
   */
  _rdfGet_isDisabled: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    if (this.getItemProperty(id, "userDisabled") == "true" ||
        this.getItemProperty(id, "appDisabled") == "true" ||
        this.getItemProperty(id, "userDisabled") == OP_NEEDS_ENABLE ||
        this.getItemProperty(id, "appDisabled") == OP_NEEDS_ENABLE)
      return EM_L("true");
    return EM_L("false");
  },

  _rdfGet_addonID: function(item, property) {
    var id = this._inner.GetTarget(item, EM_R("downloadURL"), true) ? item.Value :
                                                                      stripPrefix(item.Value, PREFIX_ITEM_URI);
    return EM_L(id);
  },

  /**
   * Get the em:updateable property - this specifies whether the item is
   * allowed to be updated
   */
  _rdfGet_updateable: function(item, property) {
    var id = stripPrefix(item.Value, PREFIX_ITEM_URI);
    var opType = this.getItemProperty(id, "opType");
    if (opType == OP_NEEDS_INSTALL || opType == OP_NEEDS_UNINSTALL ||
        opType == OP_NEEDS_UPGRADE ||
        this.getItemProperty(id, "appManaged") == "true")
      return EM_L("false");

    if (getPref("getBoolPref", (PREF_EM_ITEM_UPDATE_ENABLED.replace(/%UUID%/, id), false)) == true)
      return EM_L("false");

    var installLocation = InstallLocations.get(this.getInstallLocationKey(id));
    if (!installLocation || !installLocation.canAccess)
      return EM_L("false");

    return EM_L("true");
  },

  /**
   * See nsIRDFDataSource.idl
   */
  GetTarget: function(source, property, truthValue) {
    if (!source)
      return null;
      
    var target = null;
    var getter = "_rdfGet_" + stripPrefix(property.Value, PREFIX_NS_EM);
    if (getter in this)
      target = this[getter](source, property);

    return target || this._inner.GetTarget(source, property, truthValue);
  },
  
  /**
   * Gets an enumeration of values of a localizable property. Install Manifests
   * are generally only in one language, however an item can customize by 
   * providing localized prefs in the form:
   *
   *    extensions.{GUID}.[contributor].1
   *    extensions.{GUID}.[contributor].2
   *    extensions.{GUID}.[contributor].3
   *    ...
   *
   * to specify localized text for each of these properties.
   */
  _getLocalizablePropertyValues: function(item, property) {
    // These are localizable properties that a language pack supplied by the 
    // Extension may override.          
    var values = [];
    var prefName = PREF_EM_EXTENSION_FORMAT.replace(/%UUID%/, 
                    stripPrefix(item.Value, PREFIX_ITEM_URI)) + 
                    stripPrefix(property.Value, PREFIX_NS_EM);
    var i = 0;
    while (true) {
      try {
        var value = gPref.getComplexValue(prefName + "." + ++i, 
                                          Components.interfaces.nsIPrefLocalizedString);
        if (value.data) 
          values.push(EM_L(value.data));
      }
      catch (e) {
        try {
          var value = gPref.getComplexValue(prefName, 
                                            Components.interfaces.nsIPrefLocalizedString);
          if (value.data) 
            values.push(EM_L(value.data));
        }
        catch (e) {
        }
        break;
      }
    }
    return values.length > 0 ? values : null;
  },

  /**
   * Get the em:developer property (developers of the extension)
   */
  _rdfGets_developer: function(item, property) {
    return this._getLocalizablePropertyValues(item, property); 
  },

  /**
   * Get the em:translator property (translators of the extension)
   */
  _rdfGets_translator: function(item, property) {
    return this._getLocalizablePropertyValues(item, property); 
  },
  
  /**
   * Get the em:contributor property (contributors to the extension)
   */
  _rdfGets_contributor: function(item, property) {
    return this._getLocalizablePropertyValues(item, property); 
  },
  
  /**
   * See nsIRDFDataSource.idl
   */
  GetTargets: function(source, property, truthValue) {
    if (!source)
      return null;
      
    var ary = null;
    var propertyName = stripPrefix(property.Value, PREFIX_NS_EM);
    var getter = "_rdfGets_" + propertyName;
    if (getter in this)
      ary = this[getter](source, property);
    else {
      // The template builder calls GetTargets when single value properties
      // are used in a triple.
      getter = "_rdfGet_" + propertyName;
      if (getter in this)
        ary = [ this[getter](source, property) ];
    }
    
    return ary ? new ArrayEnumerator(ary) 
               : this._inner.GetTargets(source, property, truthValue);
  },
  
  Assert: function(source, property, target, truthValue) {
    this._inner.Assert(source, property, target, truthValue);
  },
  
  Unassert: function(source, property, target) {
    this._inner.Unassert(source, property, target);
  },
  
  Change: function(source, property, oldTarget, newTarget) {
    this._inner.Change(source, property, oldTarget, newTarget);
  },

  Move: function(oldSource, newSource, property, target) {
    this._inner.Move(oldSource, newSource, property, target);
  },
  
  HasAssertion: function(source, property, target, truthValue) {
    if (!source || !property || !target)
      return false;

    var getter = "_rdfGet_" + stripPrefix(property.Value, PREFIX_NS_EM);
    if (getter in this)
      return this[getter](source, property) == target;
    return this._inner.HasAssertion(source, property, target, truthValue);
  },
  
  _observers: [],
  AddObserver: function(observer) {
    for (var i = 0; i < this._observers.length; ++i) {
      if (this._observers[i] == observer) 
        return;
    }
    this._observers.push(observer);
    this._inner.AddObserver(observer);
  },
  
  RemoveObserver: function(observer) {
    for (var i = 0; i < this._observers.length; ++i) {
      if (this._observers[i] == observer) 
        this._observers.splice(i, 1);
    }
    this._inner.RemoveObserver(observer);
  },
  
  ArcLabelsIn: function(node) {
    return this._inner.ArcLabelsIn(node);
  },
  
  ArcLabelsOut: function(source) {
    return this._inner.ArcLabelsOut(source);
  },
  
  GetAllResources: function() {
    return this._inner.GetAllResources();
  },
  
  IsCommandEnabled: function(sources, command, arguments) {
    return this._inner.IsCommandEnabled(sources, command, arguments);
  },
  
  DoCommand: function(sources, command, arguments) {
    this._inner.DoCommand(sources, command, arguments);
  },
  
  GetAllCmds: function(source) {
    return this._inner.GetAllCmds(source);
  },
  
  hasArcIn: function(node, arc) {
    return this._inner.hasArcIn(node, arc);
  },
  
  hasArcOut: function(source, arc) {
    return this._inner.hasArcOut(source, arc);
  },
  
  beginUpdateBatch: function() {
    return this._inner.beginUpdateBatch();
  },
  
  endUpdateBatch: function() {
    return this._inner.endUpdateBatch();
  },
  
  /**
   * See nsIRDFRemoteDataSource.idl
   */
  get loaded() {
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  },
  
  Init: function(uri) {
  },
  
  Refresh: function(blocking) {
  },
  
  Flush: function() {
    if (this._inner instanceof Components.interfaces.nsIRDFRemoteDataSource)
      this._inner.Flush();
  },
  
  FlushTo: function(uri) {
  },
  
  /**
   * See nsISupports.idl
   */
  QueryInterface: function(iid) {
    if (!iid.equals(Components.interfaces.nsIRDFDataSource) &&
        !iid.equals(Components.interfaces.nsIRDFRemoteDataSource) && 
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

function UpdateItem () {
}
UpdateItem.prototype = {
  /**
   * See nsIUpdateService.idl
   */
  init: function(id, version, installLocationKey, minAppVersion, maxAppVersion,
                 name, downloadURL, xpiHash, iconURL, updateURL, type) {
    this._id                  = id;
    this._version             = version;
    this._installLocationKey  = installLocationKey;
    this._minAppVersion       = minAppVersion;
    this._maxAppVersion       = maxAppVersion;
    this._name                = name;
    this._downloadURL         = downloadURL;
    this._xpiHash             = xpiHash;
    this._iconURL             = iconURL;
    this._updateURL           = updateURL;
    this._type                = type;
  },
  
  /**
   * See nsIUpdateService.idl
   */
  get id()                { return this._id;                },
  get version()           { return this._version;           },
  get installLocationKey(){ return this._installLocationKey;},
  get minAppVersion()     { return this._minAppVersion;     },
  get maxAppVersion()     { return this._maxAppVersion;     },
  get name()              { return this._name;              },
  get xpiURL()            { return this._downloadURL;       },
  get xpiHash()           { return this._xpiHash;           },
  get iconURL()           { return this._iconURL            },
  get updateRDF()         { return this._updateURL;         },
  get type()              { return this._type;              },

  /**
   * See nsIUpdateService.idl
   */
  get objectSource() {
    return { id                 : this._id, 
             version            : this._version, 
             installLocationKey : this._installLocationKey,
             minAppVersion      : this._minAppVersion,
             maxAppVersion      : this._maxAppVersion,
             name               : this._name, 
             xpiURL             : this._downloadURL, 
             xpiHash            : this._xpiHash,
             iconURL            : this._iconURL, 
             updateRDF          : this._updateURL,
             type               : this._type 
           }.toSource();
  },
  
  /**
   * See nsISupports.idl
   */
  QueryInterface: function(iid) {
    if (!iid.equals(Components.interfaces.nsIUpdateItem) &&
        !iid.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

var gModule = {
  registerSelf: function(componentManager, fileSpec, location, type) {
    componentManager = componentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    
    for (var key in this._objects) {
      var obj = this._objects[key];
      componentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID,
                                               fileSpec, location, type);
    }

    // Make the Extension Manager a startup observer
    var categoryManager = Components.classes["@mozilla.org/categorymanager;1"]
                                    .getService(Components.interfaces.nsICategoryManager);
    categoryManager.addCategoryEntry("app-startup", this._objects.manager.className,
                                     "service," + this._objects.manager.contractID, 
                                     true, true, null);
  },
  
  getClassObject: function(componentManager, cid, iid) {
    if (!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    for (var key in this._objects) {
      if (cid.equals(this._objects[key].CID))
        return this._objects[key].factory;
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  _makeFactory: #1= function(ctor) {
    return { 
             createInstance: function (outer, iid) {
               if (outer != null)
                 throw Components.results.NS_ERROR_NO_AGGREGATION;
               return (new ctor()).QueryInterface(iid);
             } 
           };  
  },
  
  _objects: {
    manager: { CID        : ExtensionManager.prototype.classID,
               contractID : ExtensionManager.prototype.contractID,
               className  : ExtensionManager.prototype.classDescription,
               factory    : #1#(ExtensionManager)
             },
    item:    { CID        : Components.ID("{F3294B1C-89F4-46F8-98A0-44E1EAE92518}"),
               contractID : "@mozilla.org/updates/item;1",
               className  : "Update Item",
               factory    : #1#(UpdateItem)
             }
   },

  canUnload: function(componentManager) {
    return true;
  }
};

function NSGetModule(compMgr, fileSpec) {
  return gModule;
}

