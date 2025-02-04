/** 
 * @file llappviewer.cpp
 * @brief The LLAppViewer class definitions
 *
 * $LicenseInfo:firstyear=2007&license=viewergpl$
 * 
 * Copyright (c) 2007-2008, Linden Research, Inc.
 * 
 * Second Life Viewer Source Code
 * The source code in this file ("Source Code") is provided by Linden Lab
 * to you under the terms of the GNU General Public License, version 2.0
 * ("GPL"), unless you have obtained a separate licensing agreement
 * ("Other License"), formally executed by you and Linden Lab.  Terms of
 * the GPL can be found in doc/GPL-license.txt in this distribution, or
 * online at http://secondlifegrid.net/programs/open_source/licensing/gplv2
 * 
 * There are special exceptions to the terms and conditions of the GPL as
 * it is applied to this Source Code. View the full text of the exception
 * in the file doc/FLOSS-exception.txt in this software distribution, or
 * online at http://secondlifegrid.net/programs/open_source/licensing/flossexception
 * 
 * By copying, modifying or distributing this software, you acknowledge
 * that you have read and understood your obligations described above,
 * and agree to abide by those obligations.
 * 
 * ALL LINDEN LAB SOURCE CODE IS PROVIDED "AS IS." LINDEN LAB MAKES NO
 * WARRANTIES, EXPRESS, IMPLIED OR OTHERWISE, REGARDING ITS ACCURACY,
 * COMPLETENESS OR PERFORMANCE.
 * $/LicenseInfo$
 */


#include "llviewerprecompiledheaders.h"
#include "llappviewer.h"
#include "llprimitive.h"

#include "llversionviewer.h"
#include "llfeaturemanager.h"
#include "lluictrlfactory.h"
#include "lltexteditor.h"
#include "llalertdialog.h"
#include "llerrorcontrol.h"
#include "llviewerimagelist.h"
#include "llgroupmgr.h"
#include "llagent.h"
#include "llwindow.h"
#include "llviewerstats.h"
#include "llmd5.h"
#include "llpumpio.h"
#include "llimpanel.h"
#include "llmimetypes.h"
#include "llstartup.h"
#include "llfocusmgr.h"
#include "llviewerjoystick.h"
#include "llfloaterjoystick.h"
#include "llares.h" 
#include "llcurl.h"
#include "llfloatersnapshot.h"
#include "llviewerwindow.h"
#include "llviewerdisplay.h"
#include "llviewermedia.h"
#include "llviewermessage.h"
#include "llviewerobjectlist.h"
#include "llworldmap.h"
#include "llmutelist.h"
#include "llurldispatcher.h"
#include "llurlhistory.h"
#include "llfirstuse.h"
#include "llrender.h"

#include "llweb.h"
#include "llsecondlifeurls.h"

#include <boost/bind.hpp>

#if LL_WINDOWS
	#include "llwindebug.h"
#endif

#if LL_WINDOWS
#	include <share.h> // For _SH_DENYWR in initMarkerFile
#else
#   include <sys/file.h> // For initMarkerFile support
#endif

#include "llnotify.h"
#include "llviewerkeyboard.h"
#include "lllfsthread.h"
#include "llworkerthread.h"
#include "lltexturecache.h"
#include "lltexturefetch.h"
#include "llimageworker.h"

// The files below handle dependencies from cleanup.
#include "llkeyframemotion.h"
#include "llworldmap.h"
#include "llhudmanager.h"
#include "lltoolmgr.h"
#include "llassetstorage.h"
#include "llpolymesh.h"
#include "llcachename.h"
#include "audioengine.h"
#include "llviewermenu.h"
#include "llselectmgr.h"
#include "lltrans.h"
#include "lltracker.h"
#include "llviewerparcelmgr.h"
#include "llworldmapview.h"
#include "llpostprocess.h"
#include "llwlparammanager.h"
#include "llwaterparammanager.h"

#include "lldebugview.h"
#include "llconsole.h"
#include "llcontainerview.h"
#include "llfloaterstats.h"
#include "llhoverview.h"
#include "llfloatermemleak.h"

#include "llsdserialize.h"

#include "llworld.h"
#include "llhudeffecttrail.h"
#include "llvectorperfoptions.h"
#include "llurlsimstring.h"
#include "llwatchdog.h"
#include "llcallingcard.h"

// Included so that constants/settings might be initialized
// in save_settings_to_globals()
#include "llbutton.h"
#include "llcombobox.h"
#include "llstatusbar.h"
#include "llsurface.h"
#include "llvosky.h"
#include "llvotree.h"
#include "llvoavatar.h"
#include "llfolderview.h"
#include "lltoolbar.h"
#include "llframestats.h"
#include "llagentpilot.h"
#include "llsrv.h"
#include "llvovolume.h"
#include "llflexibleobject.h" 
#include "llvosurfacepatch.h"

// includes for idle() idleShutdown()
#include "llviewercontrol.h"
#include "lleventnotifier.h"
#include "llcallbacklist.h"
#include "pipeline.h"
#include "llgesturemgr.h"
#include "llsky.h"
#include "llvlmanager.h"
#include "llviewercamera.h"
#include "lldrawpoolbump.h"
#include "llvieweraudio.h"
#include "llimview.h"
#include "llviewerthrottle.h"
#include "llparcel.h"
// 

#include "llinventoryview.h"

#include "llcommandlineparser.h"

#include "hippoGridManager.h"
#include "hippoLimits.h"
#include "hippoUpdate.h"

// annoying detail to determine whether font prefs are over-ridden
#if LL_LINUX
# define LL_DYNAMIC_FONT_DISCOVERY 1
#else
# define LL_DYNAMIC_FONT_DISCOVERY 0
#endif

// *FIX: These extern globals should be cleaned up.
// The globals either represent state/config/resource-storage of either 
// this app, or another 'component' of the viewer. App globals should be 
// moved into the app class, where as the other globals should be 
// moved out of here.
// If a global symbol reference seems valid, it will be included
// via header files above.

//----------------------------------------------------------------------------
// llviewernetwork.h
#include "llviewernetwork.h"


////// Windows-specific includes to the bottom - nasty defines in these pollute the preprocessor
//
#if LL_WINDOWS && LL_LCD_COMPILE
	#include "lllcd.h"
#endif

//----------------------------------------------------------------------------
// viewer.cpp - these are only used in viewer, should be easily moved.

#if LL_DARWIN
#include <Carbon/Carbon.h>
extern void init_apple_menu(const char* product);
extern OSErr AEGURLHandler(const AppleEvent *messagein, AppleEvent *reply, long refIn);
extern OSErr AEQuitHandler(const AppleEvent *messagein, AppleEvent *reply, long refIn);
extern OSStatus simpleDialogHandler(EventHandlerCallRef handler, EventRef event, void *userdata);
#include <boost/tokenizer.hpp>
#endif // LL_DARWIN

extern BOOL gRandomizeFramerate;
extern BOOL gPeriodicSlowFrame;
extern BOOL gDebugGL;

////////////////////////////////////////////////////////////
// All from the last globals push...
BOOL gHandleKeysAsync = FALSE;

const F32 DEFAULT_AFK_TIMEOUT = 5.f * 60.f; // time with no input before user flagged as Away From Keyboard

F32 gSimLastTime; // Used in LLAppViewer::init and send_stats()
F32 gSimFrames;

std::string gDisabledMessage; // Set in LLAppViewer::initConfiguration used in idle_startup

BOOL gHideLinks = FALSE; // Set in LLAppViewer::initConfiguration, used externally

BOOL gAllowIdleAFK = TRUE;
BOOL gAllowTapTapHoldRun = TRUE;
BOOL gShowObjectUpdates = FALSE;
BOOL gUseQuickTime = TRUE;

BOOL gAcceptTOS = FALSE;
BOOL gAcceptCriticalMessage = FALSE;

eLastExecEvent gLastExecEvent = LAST_EXEC_NORMAL;

LLSD gDebugInfo;

U32	gFrameCount = 0;
U32 gForegroundFrameCount = 0; // number of frames that app window was in foreground
LLPumpIO* gServicePump = NULL;

BOOL gPacificDaylightTime = FALSE;

U64 gFrameTime = 0;
F32 gFrameTimeSeconds = 0.f;
F32 gFrameIntervalSeconds = 0.f;
F32 gFPSClamped = 10.f;						// Pretend we start at target rate.
F32 gFrameDTClamped = 0.f;					// Time between adjacent checks to network for packets
U64	gStartTime = 0; // gStartTime is "private", used only to calculate gFrameTimeSeconds
U32 gFrameStalls = 0;
const F64 FRAME_STALL_THRESHOLD = 1.0;

LLTimer gRenderStartTime;
LLFrameTimer gForegroundTime;
LLTimer gLogoutTimer;
static const F32 LOGOUT_REQUEST_TIME = 6.f;  // this will be cut short by the LogoutReply msg.
F32 gLogoutMaxTime = LOGOUT_REQUEST_TIME;

LLUUID gInventoryLibraryOwner;
LLUUID gInventoryLibraryRoot;

BOOL				gDisconnected = FALSE;

// Minimap scale in pixels per region

// used to restore texture state after a mode switch
LLFrameTimer	gRestoreGLTimer;
BOOL			gRestoreGL = FALSE;
BOOL				gUseWireframe = FALSE;

// VFS globals - see llappviewer.h
LLVFS* gStaticVFS = NULL;

LLMemoryInfo gSysMemory;
U64 gMemoryAllocated = 0; // updated in display_stats() in llviewerdisplay.cpp

std::string gLastVersionChannel;

LLVector3			gWindVec(3.0, 3.0, 0.0);
LLVector3			gRelativeWindVec(0.0, 0.0, 0.0);

U32		gPacketsIn = 0;

BOOL				gPrintMessagesThisFrame = FALSE;

BOOL gRandomizeFramerate = FALSE;
BOOL gPeriodicSlowFrame = FALSE;

BOOL gCrashOnStartup = FALSE;
BOOL gLLErrorActivated = FALSE;
BOOL gLogoutInProgress = FALSE;

////////////////////////////////////////////////////////////
// Internal globals... that should be removed.
static std::string gArgs;

const std::string MARKER_FILE_NAME("SecondLife.exec_marker");
const std::string ERROR_MARKER_FILE_NAME("SecondLife.error_marker");
const std::string LLERROR_MARKER_FILE_NAME("SecondLife.llerror_marker");
const std::string LOGOUT_MARKER_FILE_NAME("SecondLife.logout_marker");
static BOOL gDoDisconnect = FALSE;
static std::string gLaunchFileOnQuit;

//----------------------------------------------------------------------------
// File scope definitons
const char *VFS_DATA_FILE_BASE = "data.db2.x.";
const char *VFS_INDEX_FILE_BASE = "index.db2.x.";

static std::string gSecondLife;
static std::string gWindowTitle;

std::string gLoginPage;
std::vector<std::string> gLoginURIs;
static std::string gHelperURI;

LLAppViewer::LLUpdaterInfo *LLAppViewer::sUpdaterInfo = NULL ;

void idle_afk_check()
{
	// check idle timers
	if (gAllowIdleAFK && (gAwayTriggerTimer.getElapsedTimeF32() > gSavedSettings.getF32("AFKTimeout")))
	{
		gAgent.setAFK();
	}
}

// A callback set in LLAppViewer::init()
static void ui_audio_callback(const LLUUID& uuid)
{
	if (gAudiop)
	{
		gAudiop->triggerSound(uuid, gAgent.getID(), 1.0f, LLAudioEngine::AUDIO_TYPE_UI);
	}
}

void request_initial_instant_messages()
{
	static BOOL requested = FALSE;
	if (!requested
		&& gMessageSystem
		&& LLMuteList::getInstance()->isLoaded()
		&& gAgent.getAvatarObject())
	{
		// Auto-accepted inventory items may require the avatar object
		// to build a correct name.  Likewise, inventory offers from
		// muted avatars require the mute list to properly mute.
		LLMessageSystem* msg = gMessageSystem;
		msg->newMessageFast(_PREHASH_RetrieveInstantMessages);
		msg->nextBlockFast(_PREHASH_AgentData);
		msg->addUUIDFast(_PREHASH_AgentID, gAgent.getID());
		msg->addUUIDFast(_PREHASH_SessionID, gAgent.getSessionID());
		gAgent.sendReliableMessage();
		requested = TRUE;
	}
}

// A settings system callback for CrashSubmitBehavior
bool handleCrashSubmitBehaviorChanged(const LLSD& newvalue)
{
	S32 cb = newvalue.asInteger();
	const S32 NEVER_SUBMIT_REPORT = 2;
	if(cb == NEVER_SUBMIT_REPORT)
	{
// 		LLWatchdog::getInstance()->cleanup(); // SJB: cleaning up a running watchdog thread is unsafe
		LLAppViewer::instance()->destroyMainloopTimeout();
	}
	else if(gSavedSettings.getBOOL("WatchdogEnabled") == TRUE)
	{
		// Don't re-enable the watchdog when we change the setting; this may get called before it's started
// 		LLWatchdog::getInstance()->init();
	}
	return true;
}

// Use these strictly for things that are constructed at startup,
// or for things that are performance critical.  JC
static void settings_to_globals()
{
	LLBUTTON_H_PAD		= gSavedSettings.getS32("ButtonHPad");
	LLBUTTON_V_PAD		= gSavedSettings.getS32("ButtonVPad");
	BTN_HEIGHT_SMALL	= gSavedSettings.getS32("ButtonHeightSmall");
	BTN_HEIGHT			= gSavedSettings.getS32("ButtonHeight");

	MENU_BAR_HEIGHT		= gSavedSettings.getS32("MenuBarHeight");
	MENU_BAR_WIDTH		= gSavedSettings.getS32("MenuBarWidth");
	STATUS_BAR_HEIGHT	= gSavedSettings.getS32("StatusBarHeight");

	LLCOMBOBOX_HEIGHT	= BTN_HEIGHT - 2;
	LLCOMBOBOX_WIDTH	= 128;

	LLSurface::setTextureSize(gSavedSettings.getU32("RegionTextureSize"));
	
	LLImageGL::sGlobalUseAnisotropic	= gSavedSettings.getBOOL("RenderAnisotropic");
	LLVOVolume::sLODFactor				= gSavedSettings.getF32("RenderVolumeLODFactor");
	LLVOVolume::sDistanceFactor			= 1.f-LLVOVolume::sLODFactor * 0.1f;
	LLVolumeImplFlexible::sUpdateFactor = gSavedSettings.getF32("RenderFlexTimeFactor");
	LLVOTree::sTreeFactor				= gSavedSettings.getF32("RenderTreeLODFactor");
	LLVOAvatar::sLODFactor				= gSavedSettings.getF32("RenderAvatarLODFactor");
	LLVOAvatar::sMaxVisible				= gSavedSettings.getS32("RenderAvatarMaxVisible");
	LLVOAvatar::sVisibleInFirstPerson	= gSavedSettings.getBOOL("FirstPersonAvatarVisible");
	// clamp auto-open time to some minimum usable value
	LLFolderView::sAutoOpenTime			= llmax(0.25f, gSavedSettings.getF32("FolderAutoOpenDelay"));
	LLToolBar::sInventoryAutoOpenTime	= gSavedSettings.getF32("InventoryAutoOpenDelay");
	LLSelectMgr::sRectSelectInclusive	= gSavedSettings.getBOOL("RectangleSelectInclusive");
	LLSelectMgr::sRenderHiddenSelections = gSavedSettings.getBOOL("RenderHiddenSelections");
	LLSelectMgr::sRenderLightRadius = gSavedSettings.getBOOL("RenderLightRadius");

	gFrameStats.setTrackStats(gSavedSettings.getBOOL("StatsSessionTrackFrameStats"));
	gAgentPilot.mNumRuns		= gSavedSettings.getS32("StatsNumRuns");
	gAgentPilot.mQuitAfterRuns	= gSavedSettings.getBOOL("StatsQuitAfterRuns");
	gAgent.mHideGroupTitle		= gSavedSettings.getBOOL("RenderHideGroupTitle");

	gDebugWindowProc = gSavedSettings.getBOOL("DebugWindowProc");
	gAllowIdleAFK = gSavedSettings.getBOOL("AllowIdleAFK");
	gAllowTapTapHoldRun = gSavedSettings.getBOOL("AllowTapTapHoldRun");
	gShowObjectUpdates = gSavedSettings.getBOOL("ShowObjectUpdates");
	LLWorldMapView::sMapScale = gSavedSettings.getF32("MapScale");
	gHandleKeysAsync = gSavedSettings.getBOOL("AsyncKeyboard");
	LLHoverView::sShowHoverTips = gSavedSettings.getBOOL("ShowHoverTips");

	LLCubeMap::sUseCubeMaps = LLFeatureManager::getInstance()->isFeatureAvailable("RenderCubeMap");
}

static void settings_modify()
{
	LLRenderTarget::sUseFBO				= gSavedSettings.getBOOL("RenderUseFBO");
	LLVOAvatar::sUseImpostors			= gSavedSettings.getBOOL("RenderUseImpostors");
	LLVOSurfacePatch::sLODFactor		= gSavedSettings.getF32("RenderTerrainLODFactor");
	LLVOSurfacePatch::sLODFactor *= LLVOSurfacePatch::sLODFactor; //square lod factor to get exponential range of [1,4]
	gDebugGL = gSavedSettings.getBOOL("RenderDebugGL");
	gDebugPipeline = gSavedSettings.getBOOL("RenderDebugPipeline");
	
#if LL_VECTORIZE
	if (gSysCPU.hasAltivec())
	{
		gSavedSettings.setBOOL("VectorizeEnable", TRUE );
		gSavedSettings.setU32("VectorizeProcessor", 0 );
	}
	else
	if (gSysCPU.hasSSE2())
	{
		gSavedSettings.setBOOL("VectorizeEnable", TRUE );
		gSavedSettings.setU32("VectorizeProcessor", 2 );
	}
	else
	if (gSysCPU.hasSSE())
	{
		gSavedSettings.setBOOL("VectorizeEnable", TRUE );
		gSavedSettings.setU32("VectorizeProcessor", 1 );
	}
	else
	{
		// Don't bother testing or running if CPU doesn't support it. JC
		gSavedSettings.setBOOL("VectorizePerfTest", FALSE );
		gSavedSettings.setBOOL("VectorizeEnable", FALSE );
		gSavedSettings.setU32("VectorizeProcessor", 0 );
		gSavedSettings.setBOOL("VectorizeSkin", FALSE);
	}
#else
	// This build target doesn't support SSE, don't test/run.
	gSavedSettings.setBOOL("VectorizePerfTest", FALSE );
	gSavedSettings.setBOOL("VectorizeEnable", FALSE );
	gSavedSettings.setU32("VectorizeProcessor", 0 );
	gSavedSettings.setBOOL("VectorizeSkin", FALSE);
#endif
}
/*
void LLAppViewer::initGridChoice()
{
	// Load	up the initial grid	choice from:
	//	- hard coded defaults...
	//	- command line settings...
	//	- if dev build,	persisted settings...

	// Set the "grid choice", this is specified	by command line.
	std::string	grid_choice	= gSavedSettings.getString("CmdLineGridChoice");
	LLViewerLogin::getInstance()->setGridChoice(grid_choice);

	// Load last server choice by default 
	// ignored if the command line grid	choice has been	set
	if(grid_choice.empty())
	{
		S32	server = gSavedSettings.getS32("ServerChoice");
		//server = llclamp(server, 0,	(S32)GRID_INFO_COUNT - 1);
		if(server == GRID_INFO_OTHER)
		{
			std::string custom_server = gSavedSettings.getString("CustomServer");
			LLViewerLogin::getInstance()->setGridChoice(custom_server);
		}
		else if(server != (S32)GRID_INFO_NONE)
		{
			llwarns << "setgridchoice = " << server << llendl;
			LLViewerLogin::getInstance()->setGridChoice(server);
		}
	}
}
*/
//virtual
bool LLAppViewer::initSLURLHandler()
{
	// does nothing unless subclassed
	return false;
}

//virtual
bool LLAppViewer::sendURLToOtherInstance(const std::string& url)
{
	// does nothing unless subclassed
	return false;
}

//----------------------------------------------------------------------------
// LLAppViewer definition

// Static members.
// The single viewer app.
LLAppViewer* LLAppViewer::sInstance = NULL;

const std::string LLAppViewer::sGlobalSettingsName = "Global"; 
const std::string LLAppViewer::sPerAccountSettingsName = "PerAccount"; 
const std::string LLAppViewer::sCrashSettingsName = "CrashSettings"; 

LLTextureCache* LLAppViewer::sTextureCache = NULL; 
LLImageDecodeThread* LLAppViewer::sImageDecodeThread = NULL; 
LLTextureFetch* LLAppViewer::sTextureFetch = NULL; 

LLAppViewer::LLAppViewer() : 
	mMarkerFile(),
	mReportedCrash(false),
	mNumSessions(0),
	mPurgeCache(false),
	mPurgeOnExit(false),
	mSecondInstance(false),
	mSavedFinalSnapshot(false),
	mQuitRequested(false),
	mLogoutRequested(false),
	mLogoutRequestSent(false),
	mYieldTime(-1),
	mMainloopTimeout(NULL),
	mAgentRegionLastAlive(false)
{
	if(NULL != sInstance)
	{
		llerrs << "Oh no! An instance of LLAppViewer already exists! LLAppViewer is sort of like a singleton." << llendl;
	}

	sInstance = this;
}

LLAppViewer::~LLAppViewer()
{
	destroyMainloopTimeout();

	// If we got to this destructor somehow, the app didn't hang.
	removeMarkerFile();
}

bool LLAppViewer::init()
{
	//
	// Start of the application
	//
	// IMPORTANT! Do NOT put anything that will write
	// into the log files during normal startup until AFTER
	// we run the "program crashed last time" error handler below.
	//
	
	// Need to do this initialization before we do anything else, since anything
	// that touches files should really go through the lldir API
	gDirUtilp->initAppDirs("Meerkat");
	// set skin search path to default, will be overridden later
	// this allows simple skinned file lookups to work
	gDirUtilp->setSkinFolder("default");

	initLogging();
	
	//
	// OK to write stuff to logs now, we've now crash reported if necessary
	//
    if (!initConfiguration())
		return false;

    // *NOTE:Mani - LLCurl::initClass is not thread safe. 
    // Called before threads are created.
    LLCurl::initClass();

    initThreads();

    writeSystemInfo();

	// Build a string representing the current version number.
    gCurrentVersion = llformat("%s %d.%d.%d.%d", 
        gSavedSettings.getString("VersionChannelName").c_str(), 
        LL_VERSION_MAJOR, 
        LL_VERSION_MINOR, 
        LL_VERSION_PATCH, 
        LL_VERSION_BUILD );

	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////
	// *FIX: The following code isn't grouped into functions yet.

	//
	// Various introspection concerning the libs we're using - particularly
        // the libs involved in getting to a full login screen.
	//
	LL_INFOS("InitInfo") << "J2C Engine is: " << LLImageJ2C::getEngineInfo() << LL_ENDL;
	LL_INFOS("InitInfo") << "libcurl version is: " << LLCurl::getVersionString() << LL_ENDL;

	// Get the single value from the crash settings file, if it exists
	std::string crash_settings_filename = gDirUtilp->getExpandedFilename(LL_PATH_USER_SETTINGS, CRASH_SETTINGS_FILE);
	gCrashSettings.loadFromFile(crash_settings_filename);

	/////////////////////////////////////////////////
	// OS-specific login dialogs
	/////////////////////////////////////////////////

	//test_cached_control();

	// track number of times that app has run
	mNumSessions = gSavedSettings.getS32("NumSessions");
	mNumSessions++;
	gSavedSettings.setS32("NumSessions", mNumSessions);

	gSavedSettings.setString("HelpLastVisitedURL",gSavedSettings.getString("HelpHomeURL"));

	if (gSavedSettings.getBOOL("VerboseLogs"))
	{
		LLError::setPrintLocation(true);
	}
	
	// Load art UUID information, don't require these strings to be declared in code.
	std::string colors_base_filename = gDirUtilp->findSkinnedFilename("colors_base.xml");
	LL_DEBUGS("InitInfo") << "Loading base colors from " << colors_base_filename << LL_ENDL;
	gColors.loadFromFileLegacy(colors_base_filename, FALSE, TYPE_COL4U);

	// Load overrides from user colors file
	std::string user_colors_filename = gDirUtilp->findSkinnedFilename("colors.xml");
	LL_DEBUGS("InitInfo") << "Loading user colors from " << user_colors_filename << LL_ENDL;
	if (gColors.loadFromFileLegacy(user_colors_filename, FALSE, TYPE_COL4U) == 0)
	{
		LL_DEBUGS("InitInfo") << "Cannot load user colors from " << user_colors_filename << LL_ENDL;
	}

	// Widget construction depends on LLUI being initialized
	LLUI::initClass(&gSavedSettings, 
					&gColors, 
					LLUIImageList::getInstance(),
					ui_audio_callback,
					&LLUI::sGLScaleFactor);
	LLWeb::initClass();			  // do this after LLUI
	LLTextEditor::setURLCallbacks(&LLWeb::loadURL,
				&LLURLDispatcher::dispatchFromTextEditor,
				&LLURLDispatcher::dispatchFromTextEditor);
	
	LLUICtrlFactory::getInstance()->setupPaths(); // update paths with correct language set
	
	/////////////////////////////////////////////////
	//
	// Load settings files
	//
	//
	LLGroupMgr::parseRoleActions("role_actions.xml");

	LLAgent::parseTeleportMessages("teleport_strings.xml");

	LLViewerJointMesh::updateVectorize();

	// load MIME type -> media impl mappings
	LLMIMETypes::parseMIMETypes( std::string("mime_types.xml") ); 


	// Copy settings to globals. *TODO: Remove or move to appropriage class initializers
	settings_to_globals();
	// Setup settings listeners
	settings_setup_listeners();
	// Modify settings based on system configuration and compile options
	settings_modify();

	// Find partition serial number (Windows) or hardware serial (Mac)
	mSerialNumber = generateSerialNumber();

	// do any necessary set-up for accepting incoming SLURLs from apps
	initSLURLHandler();

	if(false == initHardwareTest())
	{
		// Early out from user choice.
		return false;
	}

	// Always fetch the Ethernet MAC address, needed both for login
	// and password load.
	LLUUID::getNodeID(gMACAddress);

	// Prepare for out-of-memory situations, during which we will crash on
	// purpose and save a dump.
#if LL_WINDOWS && LL_RELEASE_FOR_DOWNLOAD && LL_USE_SMARTHEAP
	MemSetErrorHandler(first_mem_error_handler);
#endif // LL_WINDOWS && LL_RELEASE_FOR_DOWNLOAD && LL_USE_SMARTHEAP

	// *Note: this is where gViewerStats used to be created.

	//
	// Initialize the VFS, and gracefully handle initialization errors
	//

	if (!initCache())
	{
		std::ostringstream msg;
		msg <<
			gSecondLife << " is unable to access a file that it needs.\n"
			"\n"
			"This can be because you somehow have multiple copies running, "
			"or your system incorrectly thinks a file is open. "
			"If this message persists, restart your computer and try again. "
			"If it continues to persist, you may need to completely uninstall " <<
			gSecondLife << " and reinstall it.";
		OSMessageBox(
			msg.str(),
			LLStringUtil::null,
			OSMB_OK);
		return 1;
	}
	
	//
	// Initialize the window
	//
	initWindow();

    // call after initWindow()
    if (gSavedSettings.getBOOL("CheckForUpdate") && !HippoUpdate::checkUpdate()) {
        // update tells us to exit the viewer
        return false;
    }

	{
		BOOL download = gSavedSettings.getBOOL("MeerkatDownloadClientTags");

		if(download)
		{
			LLVOAvatar::updateClientTags();
		}
	}

#if LL_LCD_COMPILE
		// start up an LCD window on a logitech keyboard, if there is one
		HINSTANCE hInstance = GetModuleHandle(NULL);
		gLcdScreen = new LLLCD(hInstance);
		CreateLCDDebugWindows();
#endif

	LLFolderViewItem::initClass(); // SJB: Needs to happen after initWindow(), not sure why but related to fonts
		
	gGLManager.getGLInfo(gDebugInfo);
	gGLManager.printGLInfoString();

	//load key settings
	bind_keyboard_functions();

	// Load Default bindings
	if (!gViewerKeyboard.loadBindings(gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS,"keys.ini")))
	{
		LL_ERRS("InitInfo") << "Unable to open keys.ini" << LL_ENDL;
	}
	// Load Custom bindings (override defaults)
	gViewerKeyboard.loadBindings(gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS,"custom_keys.ini"));

	// If we don't have the right GL requirements, exit.
	if (!gGLManager.mHasRequirements && !gNoRender)
	{	
		// can't use an alert here since we're existing and
		// all hell breaks lose.
		OSMessageBox(
			LLAlertDialog::getTemplateMessage("UnsupportedGLRequirements"),
			LLStringUtil::null,
			OSMB_OK);
		return 0;
	}


	bool unsupported = false;
	LLStringUtil::format_map_t args;
	std::string minSpecs;
		
	// get cpu data from xml
	std::stringstream minCPUString(LLAlertDialog::getTemplateMessage("UnsupportedCPUAmount"));
	S32 minCPU = 0;
	minCPUString >> minCPU;

	// get RAM data from XML
	std::stringstream minRAMString(LLAlertDialog::getTemplateMessage("UnsupportedRAMAmount"));
	U64 minRAM = 0;
	minRAMString >> minRAM;
	minRAM = minRAM * 1024 * 1024;

	if(!LLFeatureManager::getInstance()->isGPUSupported() && LLFeatureManager::getInstance()->getGPUClass() != GPU_CLASS_UNKNOWN)
	{
		minSpecs += LLAlertDialog::getTemplateMessage("UnsupportedGPU");
		minSpecs += "\n";
		unsupported = true;
	}
	if(gSysCPU.getMhz() < minCPU)
	{
		minSpecs += LLAlertDialog::getTemplateMessage("UnsupportedCPU");
		minSpecs += "\n";
		unsupported = true;
	}
	if(gSysMemory.getPhysicalMemoryClamped() < minRAM)
	{
		minSpecs += LLAlertDialog::getTemplateMessage("UnsupportedRAM");
		minSpecs += "\n";
		unsupported = true;
	}

	if (LLFeatureManager::getInstance()->getGPUClass() == GPU_CLASS_UNKNOWN)
	{
		gViewerWindow->alertXml("UnknownGPU");
	} 
		
	if(unsupported)
	{
		if(!gSavedSettings.controlExists("WarnUnsupportedHardware") 
			|| gSavedSettings.getBOOL("WarnUnsupportedHardware"))
		{
			args["MINSPECS"] = minSpecs;
			gViewerWindow->alertXml("UnsupportedHardware", args );
		}

	}
	
	// save the graphics card
	gDebugInfo["GraphicsCard"] = LLFeatureManager::getInstance()->getGPUString();

	// Save the current version to the prefs file
	gSavedSettings.setString("LastRunVersion", gCurrentVersion);

	gSimLastTime = gRenderStartTime.getElapsedTimeF32();
	gSimFrames = (F32)gFrameCount;

	LLViewerJoystick::getInstance()->init(false);

	return true;
}

bool LLAppViewer::mainLoop()
{
	mMainloopTimeout = new LLWatchdogTimeout();
	// *FIX:Mani - Make this a setting, once new settings exist in this branch.
	
	//-------------------------------------------
	// Run main loop until time to quit
	//-------------------------------------------

	// Create IO Pump to use for HTTP Requests.
	gServicePump = new LLPumpIO(gAPRPoolp);
	LLHTTPClient::setPump(*gServicePump);
	LLCurl::setCAFile(gDirUtilp->getCAFile());
	
	// Note: this is where gLocalSpeakerMgr and gActiveSpeakerMgr used to be instantiated.

	LLVoiceChannel::initClass();
	LLVoiceClient::init(gServicePump);
				
	LLMemType mt1(LLMemType::MTYPE_MAIN);
	LLTimer frameTimer,idleTimer;
	LLTimer debugTime;
	LLViewerJoystick* joystick(LLViewerJoystick::getInstance());
	joystick->setNeedsReset(true);
 	
	// Handle messages
	while (!LLApp::isExiting())
	{
		LLFastTimer::reset(); // Should be outside of any timer instances
		try
		{
			LLFastTimer t(LLFastTimer::FTM_FRAME);
			
			pingMainloopTimeout("Main:MiscNativeWindowEvents");
			
			{
				LLFastTimer t2(LLFastTimer::FTM_MESSAGES);
				gViewerWindow->mWindow->processMiscNativeEvents();
			}
			
			pingMainloopTimeout("Main:GatherInput");
			
			{
				LLFastTimer t2(LLFastTimer::FTM_MESSAGES);
				if (!restoreErrorTrap())
				{
					llwarns << " Someone took over my signal/exception handler (post messagehandling)!" << llendl;
				}

				gViewerWindow->mWindow->gatherInput();
			}

#if 1 && !LL_RELEASE_FOR_DOWNLOAD
			// once per second debug info
			if (debugTime.getElapsedTimeF32() > 1.f)
			{
				debugTime.reset();
			}
			
#endif
			//memory leaking simulation
			if(LLFloaterMemLeak::getInstance())
			{
				LLFloaterMemLeak::getInstance()->idle() ;				
			}			

			if (!LLApp::isExiting())
			{
				pingMainloopTimeout("Main:JoystickKeyboard");
				
				// Scan keyboard for movement keys.  Command keys and typing
				// are handled by windows callbacks.  Don't do this until we're
				// done initializing.  JC
				if (gViewerWindow->mWindow->getVisible() 
					&& gViewerWindow->getActive()
					&& !gViewerWindow->mWindow->getMinimized()
					&& LLStartUp::getStartupState() == STATE_STARTED
					&& !gViewerWindow->getShowProgress()
					&& !gFocusMgr.focusLocked())
				{
					joystick->scanJoystick();
					gKeyboard->scanKeyboard();
				}

				// Update state based on messages, user input, object idle.
				{
					pauseMainloopTimeout(); // *TODO: Remove. Messages shouldn't be stalling for 20+ seconds!
					
					LLFastTimer t3(LLFastTimer::FTM_IDLE);
					idle();

					if (gAres != NULL && gAres->isInitialized())
					{
						pingMainloopTimeout("Main:ServicePump");				
						LLFastTimer t4(LLFastTimer::FTM_PUMP);
						gAres->process();
						// this pump is necessary to make the login screen show up
						gServicePump->pump();
						gServicePump->callback();
					}
					
					resumeMainloopTimeout();
				}

				if (gDoDisconnect && (LLStartUp::getStartupState() == STATE_STARTED))
				{
					pauseMainloopTimeout();
					saveFinalSnapshot();
					disconnectViewer();
					resumeMainloopTimeout();
				}

				// Render scene.
				if (!LLApp::isExiting())
				{
					pingMainloopTimeout("Main:Display");
					display();

					pingMainloopTimeout("Main:Snapshot");
					LLFloaterSnapshot::update(); // take snapshots
					
#if LL_LCD_COMPILE
					// update LCD Screen
					pingMainloopTimeout("Main:LCD");
					gLcdScreen->UpdateDisplay();
#endif
				}

			}

			pingMainloopTimeout("Main:Sleep");
			
			pauseMainloopTimeout();

			// Sleep and run background threads
			{
				LLFastTimer t2(LLFastTimer::FTM_SLEEP);
				bool run_multiple_threads = gSavedSettings.getBOOL("RunMultipleThreads");

				// yield some time to the os based on command line option
				if(mYieldTime >= 0)
				{
					ms_sleep(mYieldTime);
				}

				// yield cooperatively when not running as foreground window
				if (   gNoRender
						|| !gViewerWindow->mWindow->getVisible()
						|| !gFocusMgr.getAppHasFocus())
				{
					// Sleep if we're not rendering, or the window is minimized.
					S32 milliseconds_to_sleep = llclamp(gSavedSettings.getS32("BackgroundYieldTime"), 0, 1000);
					// don't sleep when BackgroundYieldTime set to 0, since this will still yield to other threads
					// of equal priority on Windows
					if (milliseconds_to_sleep > 0)
					{
						ms_sleep(milliseconds_to_sleep);
						// also pause worker threads during this wait period
						LLAppViewer::getTextureCache()->pause();
						LLAppViewer::getImageDecodeThread()->pause();
					}
				}
				
				if (gRandomizeFramerate)
				{
					ms_sleep(rand() % 200);
				}

				if (gPeriodicSlowFrame
					&& (gFrameCount % 10 == 0))
				{
					llinfos << "Periodic slow frame - sleeping 500 ms" << llendl;
					ms_sleep(500);
				}


				const F64 min_frame_time = 0.0; //(.0333 - .0010); // max video frame rate = 30 fps
				const F64 min_idle_time = 0.0; //(.0010); // min idle time = 1 ms
				const F64 max_idle_time = run_multiple_threads ? min_idle_time : llmin(.005*10.0*gFrameTimeSeconds, 0.005); // 5 ms a second
				idleTimer.reset();
				while(1)
				{
					S32 work_pending = 0;
					S32 io_pending = 0;
 					work_pending += LLAppViewer::getTextureCache()->update(1); // unpauses the texture cache thread
 					work_pending += LLAppViewer::getImageDecodeThread()->update(1); // unpauses the image thread
 					work_pending += LLAppViewer::getTextureFetch()->update(1); // unpauses the texture fetch thread
					io_pending += LLVFSThread::updateClass(1);
					io_pending += LLLFSThread::updateClass(1);
					if (io_pending > 1000)
					{
						ms_sleep(llmin(io_pending/100,100)); // give the vfs some time to catch up
					}

					F64 frame_time = frameTimer.getElapsedTimeF64();
					F64 idle_time = idleTimer.getElapsedTimeF64();
					if (frame_time >= min_frame_time &&
						idle_time >= min_idle_time &&
						(!work_pending || idle_time >= max_idle_time))
					{
						break;
					}
				}
				if ((LLStartUp::getStartupState() >= STATE_CLEANUP) &&
					(frameTimer.getElapsedTimeF64() > FRAME_STALL_THRESHOLD))
				{
					gFrameStalls++;
				}
				frameTimer.reset();

				 // Prevent the worker threads from running while rendering.
				// if (LLThread::processorCount()==1) //pause() should only be required when on a single processor client...
				if (run_multiple_threads == FALSE)
				{
					LLAppViewer::getTextureCache()->pause();
					LLAppViewer::getImageDecodeThread()->pause();
					// LLAppViewer::getTextureFetch()->pause(); // Don't pause the fetch (IO) thread
				}
				//LLVFSThread::sLocal->pause(); // Prevent the VFS thread from running while rendering.
				//LLLFSThread::sLocal->pause(); // Prevent the LFS thread from running while rendering.

				resumeMainloopTimeout();
	
				pingMainloopTimeout("Main:End");
			}
						
		}
		catch(std::bad_alloc)
		{			
			//stop memory leaking simulation
			if(LLFloaterMemLeak::getInstance())
			{
				LLFloaterMemLeak::getInstance()->stop() ;				
				llwarns << "Bad memory allocation in LLAppViewer::mainLoop()!" << llendl ;
			}
			else
			{
				llerrs << "Bad memory allocation in LLAppViewer::mainLoop()!" << llendl ;
			}
		}
	}

	// Save snapshot for next time, if we made it through initialization
	if (STATE_STARTED == LLStartUp::getStartupState())
	{
		try
		{
			saveFinalSnapshot();
		}
		catch(std::bad_alloc)
		{
			llwarns << "Bad memory allocation when saveFinalSnapshot() is called!" << llendl ;

			//stop memory leaking simulation
			if(LLFloaterMemLeak::getInstance())
			{
				LLFloaterMemLeak::getInstance()->stop() ;				
			}	
		}
	}
	
	delete gServicePump;

	destroyMainloopTimeout();

	llinfos << "Exiting main_loop" << llendflush;

	return true;
}

bool LLAppViewer::cleanup()
{
	//flag all elements as needing to be destroyed immediately
	// to ensure shutdown order
	LLMortician::setZealous(TRUE);

	if (mQuitRequested)
		LLVoiceClient::terminate();
	
	disconnectViewer();

	llinfos << "Viewer disconnected" << llendflush;





	//this deletes all your buddies
	LLAvatarTracker::instance().reset();

	if (mQuitRequested)
		display_cleanup(); 

	release_start_screen(); // just in case

	LLError::logToFixedBuffer(NULL);

	llinfos << "Cleaning Up" << llendflush;

	// Must clean up texture references before viewer window is destroyed.
	LLHUDObject::cleanupHUDObjects();
	llinfos << "HUD Objects cleaned up" << llendflush;

	LLKeyframeDataCache::clear();

	//clear all the chat off the screen	
	gConsole->clear();

	if (!mQuitRequested) //if we are doing a soft cleanup, bail here
	{
		return true;
	}
 	// End TransferManager before deleting systems it depends on (Audio, VFS, AssetStorage)
#if 0 // this seems to get us stuck in an infinite loop...
	gTransferManager.cleanup();
#endif
	
	// Note: this is where gWorldMap used to be deleted.

	// Note: this is where gHUDManager used to be deleted.
	LLHUDManager::getInstance()->shutdownClass();
	

	delete gAssetStorage;
	gAssetStorage = NULL;

	LLPolyMesh::freeAllMeshes();

	delete gCacheName;
	gCacheName = NULL;

	// Note: this is where gLocalSpeakerMgr and gActiveSpeakerMgr used to be deleted.

	LLNotifyBox::cleanup();

	LLWorldMap::getInstance()->reset(); // release any images
	
	llinfos << "Global stuff deleted" << llendflush;

#if !LL_RELEASE_FOR_DOWNLOAD
	if (gAudiop)
	{
		gAudiop->shutdown();
	}
#else
	// This hack exists because fmod likes to occasionally hang forever
	// when shutting down for no apparent reason.
	llwarns << "Hack, skipping audio engine cleanup" << llendflush;
#endif

	// Note: this is where LLFeatureManager::getInstance()-> used to be deleted.

	// Patch up settings for next time
	// Must do this before we delete the viewer window,
	// such that we can suck rectangle information out of
	// it.
	cleanupSavedSettings();
	llinfos << "Settings patched up" << llendflush;

	delete gAudiop;
	gAudiop = NULL;

	// delete some of the files left around in the cache.
	//removeCacheFiles("*.wav");
	removeCacheFiles("*.tmp");
	//removeCacheFiles("*.lso");
	removeCacheFiles("*.out");
	//removeCacheFiles("*.dsf");
	removeCacheFiles("*.bodypart");
	removeCacheFiles("*.clothing");

	llinfos << "Cache files removed" << llendflush;


	cleanup_menus();

	// Wait for any pending VFS IO
	while (1)
	{
		S32 pending = LLVFSThread::updateClass(0);
		pending += LLLFSThread::updateClass(0);
		if (!pending)
		{
			break;
		}
		llinfos << "Waiting for pending IO to finish: " << pending << llendflush;
		ms_sleep(100);
	}
	llinfos << "Shutting down." << llendflush;

	// Destroy the UI
	gViewerWindow->shutdownViews();

	// Clean up selection managers after UI is destroyed, as UI may be observing them.
	// Clean up before GL is shut down because we might be holding on to objects with texture references
	LLSelectMgr::cleanupGlobals();

	// Shut down OpenGL
	gViewerWindow->shutdownGL();
	
	// Destroy window, and make sure we're not fullscreen
	// This may generate window reshape and activation events.
	// Therefore must do this before destroying the message system.
	delete gViewerWindow;
	gViewerWindow = NULL;
	llinfos << "ViewerWindow deleted" << llendflush;

	// viewer UI relies on keyboard so keep it aound until viewer UI isa gone
	delete gKeyboard;
	gKeyboard = NULL;
	// Clean up selection managers after UI is destroyed, as UI
	// may be observing them.
	LLSelectMgr::cleanupGlobals();
	
	LLViewerObject::cleanupVOClasses();

	LLWaterParamManager::cleanupClass();
	LLWLParamManager::cleanupClass();
	LLPostProcess::cleanupClass();

	LLTracker::cleanupInstance();
	

	// *FIX: This is handled in LLAppViewerWin32::cleanup().
	// I'm keeping the comment to remember its order in cleanup,
	// in case of unforseen dependency.
	//#if LL_WINDOWS
	//	gDXHardware.cleanup();
	//#endif // LL_WINDOWS

#if LL_LCD_COMPILE
	// shut down the LCD window on a logitech keyboard, if there is one
	delete gLcdScreen;
	gLcdScreen = NULL;
#endif

	LLVolumeMgr* volume_manager = LLPrimitive::getVolumeManager();
	if (!volume_manager->cleanup())
	{
		llwarns << "Remaining references in the volume manager!" << llendflush;
	}
	LLPrimitive::cleanupVolumeManager();

	LLViewerParcelMgr::cleanupGlobals();

	// *Note: this is where gViewerStats used to be deleted.

 	//end_messaging_system();

	LLFollowCamMgr::cleanupClass();
	//LLVolumeMgr::cleanupClass();
	LLPrimitive::cleanupVolumeManager();
	LLWorldMapView::cleanupClass();
	LLFolderViewItem::cleanupClass();
	LLUI::cleanupClass();
	
	//
	// Shut down the VFS's AFTER the decode manager cleans up (since it cleans up vfiles).
	// Also after viewerwindow is deleted, since it may have image pointers (which have vfiles)
	// Also after shutting down the messaging system since it has VFS dependencies

	//
	LLVFile::cleanupClass();
	llinfos << "VFS cleaned up" << llendflush;

	// Store the time of our current logoff
	gSavedPerAccountSettings.setU32("LastLogoff", time_corrected());

	// Must do this after all panels have been deleted because panels that have persistent rects
	// save their rects on delete.
	gSavedSettings.saveToFile(gSavedSettings.getString("ClientSettingsFile"), TRUE);	

	// PerAccountSettingsFile should be empty if no use has been logged on.
	// *FIX:Mani This should get really saved in a "logoff" mode. 
	gSavedPerAccountSettings.saveToFile(gSavedSettings.getString("PerAccountSettingsFile"), TRUE);
	llinfos << "Saved settings" << llendflush;

	std::string crash_settings_filename = gDirUtilp->getExpandedFilename(LL_PATH_USER_SETTINGS, CRASH_SETTINGS_FILE);
	// save all settings, even if equals defaults
	gCrashSettings.saveToFile(crash_settings_filename, FALSE);

	// Save URL history file
	LLURLHistory::saveFile("url_history.xml");

	// save mute list. gMuteList used to also be deleted here too.
	LLMuteList::getInstance()->cache(gAgent.getID());


	if (mPurgeOnExit)
	{
		llinfos << "Purging all cache files on exit" << llendflush;
		std::string mask = gDirUtilp->getDirDelimiter() + "*.*";
		gDirUtilp->deleteFilesInDir(gDirUtilp->getExpandedFilename(LL_PATH_CACHE,""),mask);
	}

	removeMarkerFile(); // Any crashes from here on we'll just have to ignore
	
	writeDebugInfo();

	// Let threads finish
	LLTimer idleTimer;
	idleTimer.reset();
	const F64 max_idle_time = 5.f; // 5 seconds
	while(1)
	{
		S32 pending = 0;
		pending += LLAppViewer::getTextureCache()->update(1); // unpauses the worker thread
		pending += LLAppViewer::getImageDecodeThread()->update(1); // unpauses the image thread
		pending += LLAppViewer::getTextureFetch()->update(1); // unpauses the texture fetch thread
		pending += LLVFSThread::updateClass(0);
		pending += LLLFSThread::updateClass(0);
		F64 idle_time = idleTimer.getElapsedTimeF64();
		if (!pending || idle_time >= max_idle_time)
		{
			llwarns << "Quitting with pending background tasks." << llendl;
			break;
		}
	}
	
	// Delete workers first
	// shotdown all worker threads before deleting them in case of co-dependencies
	sTextureCache->shutdown();
	sTextureFetch->shutdown();
	sImageDecodeThread->shutdown();
	delete sTextureCache;
    sTextureCache = NULL;
	delete sTextureFetch;
    sTextureFetch = NULL;
	delete sImageDecodeThread;
    sImageDecodeThread = NULL;

    //Note: 
    //LLViewerMedia::cleanupClass() has to be put before gImageList.shutdown() 
    //because some new image might be generated during cleaning up media. --bao 
    LLViewerMedia::cleanupClass();
	gImageList.shutdown(); // shutdown again in case a callback added something
	LLUIImageList::getInstance()->cleanUp();
	
	// This should eventually be done in LLAppViewer
	LLImage::cleanupClass();
	LLVFSThread::cleanupClass();
	LLLFSThread::cleanupClass();

	llinfos << "VFS Thread finished" << llendflush;

#ifndef LL_RELEASE_FOR_DOWNLOAD
	llinfos << "Auditing VFS" << llendl;
	gVFS->audit();
#endif

	// For safety, the LLVFS has to be deleted *after* LLVFSThread. This should be cleaned up.
	// (LLVFS doesn't know about LLVFSThread so can't kill pending requests) -Steve
	delete gStaticVFS;
	gStaticVFS = NULL;
	delete gVFS;
	gVFS = NULL;

	// Cleanup settings last in case other clases reference them
	gSavedSettings.cleanup();
	gColors.cleanup();
	gCrashSettings.cleanup();
	
	LLWatchdog::getInstance()->cleanup();

	end_messaging_system();
	llinfos << "Message system deleted." << llendflush;

	// *NOTE:Mani - The following call is not thread safe. 
	LLCurl::cleanupClass();
	llinfos << "LLCurl cleaned up." << llendflush;

	// If we're exiting to launch an URL, do that here so the screen
	// is at the right resolution before we launch IE.
	if (!gLaunchFileOnQuit.empty())
	{
		llinfos << "Launch file on quit." << llendflush;
#if LL_WINDOWS
		// Indicate an application is starting.
		SetCursor(LoadCursor(NULL, IDC_WAIT));
#endif

		// HACK: Attempt to wait until the screen res. switch is complete.
		ms_sleep(1000);

		LLWeb::loadURLExternal( gLaunchFileOnQuit );
		llinfos << "File launched." << llendflush;
	}

    llinfos << "Goodbye" << llendflush;

	// return 0;
	return true;
}

// A callback for llerrs to call during the watchdog error.
void watchdog_llerrs_callback(const std::string &error_string)
{
	gLLErrorActivated = true;

#ifdef LL_WINDOWS
	RaiseException(0,0,0,0);
#else
	raise(SIGQUIT);
#endif
}

// A callback for the watchdog to call.
void watchdog_killer_callback()
{
	LLError::setFatalFunction(watchdog_llerrs_callback);
	llerrs << "Watchdog killer event" << llendl;
}

bool LLAppViewer::initThreads()
{
#if MEM_TRACK_MEM
	static const bool enable_threads = false;
#else
	static const bool enable_threads = true;
#endif

	const S32 NEVER_SUBMIT_REPORT = 2;
	bool use_watchdog = gSavedSettings.getBOOL("WatchdogEnabled");
	bool send_reports = gCrashSettings.getS32(CRASH_BEHAVIOR_SETTING) != NEVER_SUBMIT_REPORT;
	if(use_watchdog && send_reports)
	{
		LLWatchdog::getInstance()->init(watchdog_killer_callback);
	}

	LLVFSThread::initClass(enable_threads && false);
	LLLFSThread::initClass(enable_threads && false);

	// Image decoding
	LLAppViewer::sImageDecodeThread = new LLImageDecodeThread(enable_threads && true);
	LLAppViewer::sTextureCache = new LLTextureCache(enable_threads && true);
	LLAppViewer::sTextureFetch = new LLTextureFetch(LLAppViewer::getTextureCache(), sImageDecodeThread, enable_threads && true);
	LLImage::initClass();

	// *FIX: no error handling here!
	return true;
}

void errorCallback(const std::string &error_string)
{
#ifndef LL_RELEASE_FOR_DOWNLOAD
	OSMessageBox(error_string, "Fatal Error", OSMB_OK);
#endif

	//Set the ErrorActivated global so we know to create a marker file
	gLLErrorActivated = true;
	
	LLError::crashAndLoop(error_string);
}

bool LLAppViewer::initLogging()
{
	//
	// Set up logging defaults for the viewer
	//
	LLError::initForApplication(
				gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS, ""));
	LLError::setFatalFunction(errorCallback);
	
	// Remove the last ".old" log file.
	std::string old_log_file = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,
							     "SecondLife.old");
	LLFile::remove(old_log_file);

	// Rename current log file to ".old"
	std::string log_file = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,
							     "SecondLife.log");
	LLFile::rename(log_file, old_log_file);

	// Set the log file to SecondLife.log

	LLError::logToFile(log_file);

	// *FIX:Mani no error handling here!
	return true;
}

bool LLAppViewer::loadSettingsFromDirectory(ELLPath path_index, bool set_defaults)
{	
	for(LLSD::map_iterator itr = mSettingsFileList.beginMap(); itr != mSettingsFileList.endMap(); ++itr)
	{
		std::string settings_name = (*itr).first;
		std::string settings_file = mSettingsFileList[settings_name].asString();

		std::string full_settings_path = gDirUtilp->getExpandedFilename(path_index, settings_file);

		if(settings_name == sGlobalSettingsName 
			&& path_index == LL_PATH_USER_SETTINGS)
		{
			// The non-persistent setting, ClientSettingsFile, specifies a 
			// custom name to use for the global settings file.
			// Only apply this setting if this method is setting the 'Global' 
			// settings from the user_settings path.
			std::string custom_path;
			if(gSettings[sGlobalSettingsName]->controlExists("ClientSettingsFile"))
			{
				custom_path = 
					gSettings[sGlobalSettingsName]->getString("ClientSettingsFile");
			}
			if(!custom_path.empty())
			{
				full_settings_path = custom_path;
			}
		}

		if(gSettings.find(settings_name) == gSettings.end())
		{
			llwarns << "Cannot load " << settings_file << " - No matching settings group for name " << settings_name << llendl;
			continue;
		}
		if(!gSettings[settings_name]->loadFromFile(full_settings_path, set_defaults))
		{
			// If attempting to load the default global settings (app_settings/settings.xml) 
			// fails, the app should error and quit.
			if(path_index == LL_PATH_APP_SETTINGS && settings_name == sGlobalSettingsName)
			{
				llwarns << "Error: Cannot load default settings from: " << full_settings_path << llendl;
				return false;
			}
			else
			{
				llwarns << "Cannot load " << full_settings_path << " - No settings found." << llendl;
			}
		}
		else
		{
			llinfos << "Loaded settings file " << full_settings_path << llendl;
		}
	}
	return true;
}

std::string LLAppViewer::getSettingsFileName(const std::string& file)
{
	if(mSettingsFileList.has(file))
	{
		return mSettingsFileList[file].asString();
	}
	return std::string();
}

bool LLAppViewer::initConfiguration()
{	
	//Set up internal pointers	
	gSettings[sGlobalSettingsName] = &gSavedSettings;
	gSettings[sPerAccountSettingsName] = &gSavedPerAccountSettings;
	gSettings[sCrashSettingsName] = &gCrashSettings;

	//Load settings files list
	std::string settings_file_list = gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS, "settings_files.xml");
	LLControlGroup settings_control;
	llinfos << "Loading settings file list" << settings_file_list << llendl;
	if (0 == settings_control.loadFromFile(settings_file_list))
	{
        llerrs << "Cannot load default configuration file " << settings_file_list << llendl;
	}

	mSettingsFileList = settings_control.getLLSD("Files");
	
	// The settings and command line parsing have a fragile
	// order-of-operation:
	// - load defaults from app_settings
	// - set procedural settings values
	// - read command line settings
	// - selectively apply settings needed to load user settings.
    // - load overrides from user_settings 
	// - apply command line settings (to override the overrides)
	// - load per account settings (happens in llstartup
	
	// - load defaults
	bool set_defaults = true;
	if(!loadSettingsFromDirectory(LL_PATH_APP_SETTINGS, set_defaults))
	{
		std::ostringstream msg;
		msg << "Second Life could not load its default settings file. \n" 
			<< "The installation may be corrupted. \n";

		OSMessageBox(
			msg.str(),
			LLStringUtil::null,
			OSMB_OK);

		return false;
	}

	// - set procedural settings 
	gSavedSettings.setString("ClientSettingsFile", 
        gDirUtilp->getExpandedFilename(LL_PATH_USER_SETTINGS, getSettingsFileName("Global")));

	gSavedSettings.setString("VersionChannelName", LL_CHANNEL);

#ifndef	LL_RELEASE_FOR_DOWNLOAD
        gSavedSettings.setBOOL("ShowConsoleWindow", TRUE);
        gSavedSettings.setBOOL("AllowMultipleViewers", TRUE);
#endif

#if !LL_DYNAMIC_FONT_DISCOVERY
	// static font discovery - user settings can override.
	gSavedSettings.setString("FontSansSerifFallback",
				 LLWindow::getFontListSans());
#endif

	//*FIX:Mani - Set default to disabling watchdog mainloop 
	// timeout for mac and linux. There is no call stack info 
	// on these platform to help debug.
#ifndef	LL_RELEASE_FOR_DOWNLOAD
	gSavedSettings.setBOOL("WatchdogEnabled", FALSE);
	gSavedSettings.setBOOL("QAMode", TRUE );
#endif

#ifndef LL_WINDOWS
	gSavedSettings.setBOOL("WatchdogEnabled", FALSE);
#endif

	gCrashSettings.getControl(CRASH_BEHAVIOR_SETTING)->getSignal()->connect(boost::bind(&handleCrashSubmitBehaviorChanged, _1));	

	// These are warnings that appear on the first experience of that condition.
	// They are already set in the settings_default.xml file, but still need to be added to LLFirstUse
	// for disable/reset ability
	LLFirstUse::addConfigVariable("FirstBalanceIncrease");
	LLFirstUse::addConfigVariable("FirstBalanceDecrease");
	LLFirstUse::addConfigVariable("FirstSit");
	LLFirstUse::addConfigVariable("FirstMap");
	LLFirstUse::addConfigVariable("FirstGoTo");
	LLFirstUse::addConfigVariable("FirstBuild");
	LLFirstUse::addConfigVariable("FirstLeftClickNoHit");
	LLFirstUse::addConfigVariable("FirstTeleport");
	LLFirstUse::addConfigVariable("FirstOverrideKeys");
	LLFirstUse::addConfigVariable("FirstAttach");
	LLFirstUse::addConfigVariable("FirstAppearance");
	LLFirstUse::addConfigVariable("FirstInventory");
	LLFirstUse::addConfigVariable("FirstSandbox");
	LLFirstUse::addConfigVariable("FirstFlexible");
	LLFirstUse::addConfigVariable("FirstDebugMenus");
	LLFirstUse::addConfigVariable("FirstStreamingMusic");
	LLFirstUse::addConfigVariable("FirstStreamingVideo");
	LLFirstUse::addConfigVariable("FirstSculptedPrim");
	LLFirstUse::addConfigVariable("FirstVoice");
	LLFirstUse::addConfigVariable("FirstMedia");
		
    //////
    // *FIX:Mani - Find a way to remove the gUICtrlFactory and
    // LLAlertDialog::parseAlerts dependecies on the being loaded
    // *before* the user settings. Having to do this init here
    // seems odd. 

	// This is where gUICtrlFactory used to be instantiated with a new LLUICtrlFactory
	// which needed to happen before calling parseAlerts below.
	// TODO: That method is still dependant upon the base LLUICtrlFactory constructor being called
	// which registers some callbacks so I'm leaving in a call to getInstance here to cause that to
	// still happen. This needs to be cleaned up later when the base and derived classes
	// are planned to be combined. -MG
	LLUICtrlFactory::getInstance();
	

	// Pre-load alerts.xml to define the warnings settings (always loads from skins/xui/en-us/)
	// Do this *before* loading the settings file
	LLAlertDialog::parseAlerts("alerts.xml", &gSavedSettings, TRUE);

	// - read command line settings.
	LLControlGroupCLP clp;
	std::string	cmd_line_config	= gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS,
														  "cmd_line.xml");
	clp.configure(cmd_line_config, &gSavedSettings);

	if(!initParseCommandLine(clp))
	{
		llwarns	
			<< "Error parsing command line options.	Command	Line options ignored." 
			<< llendl;

		llinfos	<< "Command	line usage:\n" << clp << llendl;

		std::ostringstream msg;
		msg << "Meerkat found an error parsing the command line. \n" 
			<< "Please see: http://wiki.secondlife.com/wiki/Client_parameters \n"
			<< "Error: " << clp.getErrorMessage();

		OSMessageBox(
			msg.str(),
			LLStringUtil::null,
			OSMB_OK);

		return false;
	}
	
	// - selectively apply settings 

	// If the user has specified a alternate settings file name.
	// Load	it now before loading the user_settings/settings.xml
	if(clp.hasOption("settings"))
	{
		std::string	user_settings_filename = 
			gDirUtilp->getExpandedFilename(LL_PATH_USER_SETTINGS, 
										   clp.getOption("settings")[0]);		
		gSavedSettings.setString("ClientSettingsFile", user_settings_filename);
		llinfos	<< "Using command line specified settings filename: " 
			<< user_settings_filename << llendl;
	}

	// - load overrides from user_settings 
	loadSettingsFromDirectory(LL_PATH_USER_SETTINGS);

#if LL_DYNAMIC_FONT_DISCOVERY
	// Linux does *dynamic* font discovery which is preferable to
	// whatever got written-out into the config file last time.  This
	// does remove the ability of the user to hand-define the fallbacks
	// though, so from a config-management point of view this is hacky.
	gSavedSettings.setString("FontSansSerifFallback",
				 LLWindow::getFontListSans());
#endif

	// - apply command line settings 
	clp.notify(); 

	// Handle initialization from settings.
	// Start up	the	debugging console before handling other	options.
	if (gSavedSettings.getBOOL("ShowConsoleWindow"))
	{
		initConsole();
	}

	if(clp.hasOption("help"))
	{
		std::ostringstream msg;
		msg << "Command	line usage:\n" << clp;
		llinfos	<< msg.str() << llendl;

		OSMessageBox(
			msg.str().c_str(),
			LLStringUtil::null,
			OSMB_OK);

		return false;
	}

    //////////////////////////
    // Apply settings...
    if(clp.hasOption("setdefault"))
    {
        //const LLCommandLineParser::token_vector_t& setdefault = clp.getOption("setdefault");
        //if(0x1 & setdefault.size())
        //{
        //    llwarns << "Invalid '--setdefault' parameter count." << llendl;
        //}
        //else
        //{
        //    LLCommandLineParser::token_vector_t::const_iterator itr = setdefault.begin();
        //    for(; itr != setdefault.end(); ++itr)
        //    {
        //        const std::string& name = *itr;
        //        const std::string& value = *(++itr);
        //        LLControlVariable* c = gSettings[sGlobalSettingsName]->getControl(name);
        //        if(c)
        //        {
        //            c->setDefault(value);
        //        }
        //        else
        //        {
        //            llwarns << "'--setdefault' specified with unknown setting: '"
        //                << name << "'." << llendl;
        //        }
        //    }
        //}
    }

    if(clp.hasOption("set"))
    {
        const LLCommandLineParser::token_vector_t& set_values = clp.getOption("set");
        if(0x1 & set_values.size())
        {
            llwarns << "Invalid '--set' parameter count." << llendl;
        }
        else
        {
            LLCommandLineParser::token_vector_t::const_iterator itr = set_values.begin();
            for(; itr != set_values.end(); ++itr)
            {
                const std::string& name = *itr;
                const std::string& value = *(++itr);
                LLControlVariable* c = gSettings[sGlobalSettingsName]->getControl(name);
                if(c)
                {
                    c->setValue(value, false);
                }
                else
                {
                    llwarns << "'--set' specified with unknown setting: '"
                        << name << "'." << llendl;
                }
            }
        }
    }

	//init Hippo grid manager
	if (!gHippoGridManager) {
		gHippoGridManager = new HippoGridManager();
		gHippoGridManager->init();
	}

	if (!gHippoLimits) {
		gHippoLimits = new HippoLimits();
	}

    //initGridChoice();

	// If we have specified crash on startup, set the global so we'll trigger the crash at the right time
	if(clp.hasOption("crashonstartup"))
	{
		gCrashOnStartup = TRUE;
	}

	// Handle slurl use. NOTE: Don't let SL-55321 reappear.

    // *FIX: This init code should be made more robust to prevent 
    // the issue SL-55321 from returning. One thought is to allow 
    // only select options to be set from command line when a slurl 
    // is specified. More work on the settings system is needed to 
    // achieve this. For now...

    // *NOTE:Mani The command line parser parses tokens and is 
    // setup to bail after parsing the '--url' option or the 
    // first option specified without a '--option' flag (or
    // any other option that uses the 'last_option' setting - 
    // see LLControlGroupCLP::configure())

    // What can happen is that someone can use IE (or potentially 
    // other browsers) and do the rough equivalent of command 
    // injection and steal passwords. Phoenix. SL-55321
    if(clp.hasOption("url"))
    {
        std::string slurl = clp.getOption("url")[0];
        if (LLURLDispatcher::isSLURLCommand(slurl))
        {
	        LLStartUp::sSLURLCommand = slurl;
        }
        else
        {
	        LLURLSimString::setString(slurl);
        }
    }
    else if(clp.hasOption("slurl"))
    {
        std::string slurl = clp.getOption("slurl")[0];
        if(LLURLDispatcher::isSLURL(slurl))
        {
            if (LLURLDispatcher::isSLURLCommand(slurl))
            {
	            LLStartUp::sSLURLCommand = slurl;
            }
            else
            {
	            LLURLSimString::setString(slurl);
            }
        }
    }

    const LLControlVariable* skinfolder = gSavedSettings.getControl("SkinCurrent");
    if(skinfolder && LLStringUtil::null != skinfolder->getValue().asString())
    {   
        gDirUtilp->setSkinFolder(skinfolder->getValue().asString());
    }

    mYieldTime = gSavedSettings.getS32("YieldTime");
             
	// XUI:translate
	gSecondLife = "Meerkat";

	// Read skin/branding settings if specified.
	//if (! gDirUtilp->getSkinDir().empty() )
	//{
	//	std::string skin_def_file = gDirUtilp->findSkinnedFilename("skin.xml");
	//	LLXmlTree skin_def_tree;

	//	if (!skin_def_tree.parseFile(skin_def_file))
	//	{
	//		llerrs << "Failed to parse skin definition." << llendl;
	//	}

	//	LLXmlTreeNode* rootp = skin_def_tree.getRoot();
	//	LLXmlTreeNode* disabled_message_node = rootp->getChildByName("disabled_message");	
	//	if (disabled_message_node)
	//	{
	//		gDisabledMessage = disabled_message_node->getContents();
	//	}

	//	static LLStdStringHandle hide_links_string = LLXmlTree::addAttributeString("hide_links");
	//	rootp->getFastAttributeBOOL(hide_links_string, gHideLinks);

	//	// Legacy string.  This flag really meant we didn't want to expose references to "Second Life".
	//	// Just set gHideLinks instead.
	//	static LLStdStringHandle silent_string = LLXmlTree::addAttributeString("silent_update");
	//	BOOL silent_update;
	//	rootp->getFastAttributeBOOL(silent_string, silent_update);
	//	gHideLinks = (gHideLinks || silent_update);
	//}

#if LL_DARWIN
	// Initialize apple menubar and various callbacks
	init_apple_menu(gSecondLife.c_str());

#if __ppc__
	// If the CPU doesn't have Altivec (i.e. it's not at least a G4), don't go any further.
	// Only test PowerPC - all Intel Macs have SSE.
	if(!gSysCPU.hasAltivec())
	{
		std::ostringstream msg;
		msg << gSecondLife << " requires a processor with AltiVec (G4 or later).";
		OSMessageBox(
			msg.str(),
			LLStringUtil::null,
			OSMB_OK);
		removeMarkerFile();
		return false;
	}
#endif
	
#endif // LL_DARWIN

	// Display splash screen.  Must be after above check for previous
	// crash as this dialog is always frontmost.
	std::ostringstream splash_msg;
	splash_msg << "Loading " << gSecondLife << "...";
	LLSplashScreen::show();
	LLSplashScreen::update(splash_msg.str());

	//LLVolumeMgr::initClass();
	LLVolumeMgr* volume_manager = new LLVolumeMgr();
	volume_manager->useMutex();	// LLApp and LLMutex magic must be manually enabled
	LLPrimitive::setVolumeManager(volume_manager);

	// Note: this is where we used to initialize gFeatureManagerp.

	gStartTime = totalTime();

	//
	// Set the name of the window
	//
#if LL_RELEASE_FOR_DOWNLOAD
	gWindowTitle = gSecondLife;
#elif LL_DEBUG
	gWindowTitle = gSecondLife + std::string(" [DEBUG] ") + gArgs;
#else
	gWindowTitle = gSecondLife + std::string(" ") + gArgs;
#endif
	LLStringUtil::truncate(gWindowTitle, 255);

	//RN: if we received a URL, hand it off to the existing instance.
	// don't call anotherInstanceRunning() when doing URL handoff, as
	// it relies on checking a marker file which will not work when running
	// out of different directories
	std::string slurl;
	if (!LLStartUp::sSLURLCommand.empty())
	{
		slurl = LLStartUp::sSLURLCommand;
	}
	else if (LLURLSimString::parse())
	{
		slurl = LLURLSimString::getURL();
	}
	if (!slurl.empty())
	{
		if (sendURLToOtherInstance(slurl))
		{
			// successfully handed off URL to existing instance, exit
			return false;
		}
	}

	if (!gSavedSettings.getBOOL("AllowMultipleViewers"))
	{
	    //
	    // Check for another instance of the app running
	    //

		mSecondInstance = anotherInstanceRunning();
		
		if (mSecondInstance)
		{
			std::ostringstream msg;
			msg << 
				gSecondLife << " is already running.\n"
				"\n"
				"Check your task bar for a minimized copy of the program.\n"
				"If this message persists, restart your computer.",
			OSMessageBox(
				msg.str(),
				LLStringUtil::null,
				OSMB_OK);
			return false;
		}

		initMarkerFile();

#if LL_SEND_CRASH_REPORTS
		if (gLastExecEvent == LAST_EXEC_FROZE)
		{
			llinfos << "Last execution froze, requesting to send crash report." << llendl;
			//
			// Pop up a freeze or crash warning dialog
			//
			std::ostringstream msg;
			msg << gSecondLife
				<< " appears to have frozen or crashed on the previous run.\n"
				<< "Would you like to send a crash report?";
			std::string alert;
			alert = gSecondLife;
			alert += " Alert";
			S32 choice = OSMessageBox(msg.str(),
									  alert,
									  OSMB_YESNO);
			if (OSBTN_YES == choice)
			{
				llinfos << "Sending crash report." << llendl;

				bool report_freeze = true;
				handleCrashReporting(report_freeze);
			}
			else
			{
				llinfos << "Not sending crash report." << llendl;
			}
		}
#endif // #if LL_SEND_CRASH_REPORTS
	}
	else
	{
		mSecondInstance = anotherInstanceRunning();
		
		if (mSecondInstance)
		{
			// This is the second instance of SL. Turn off voice support,
			// but make sure the setting is *not* persisted.
			LLControlVariable* disable_voice = gSavedSettings.getControl("CmdLineDisableVoice");
			if(disable_voice)
			{
				const BOOL DO_NOT_PERSIST = FALSE;
				disable_voice->setValue(LLSD(TRUE), DO_NOT_PERSIST);
			}
		}

		initMarkerFile();
	}

   	// need to do this here - need to have initialized global settings first
	std::string nextLoginLocation = gSavedSettings.getString( "NextLoginLocation" );
	if ( nextLoginLocation.length() )
	{
		LLURLSimString::setString( nextLoginLocation );
	};

	gLastRunVersion = gSavedSettings.getString("LastRunVersion");

	return true; // Config was successful.
}

bool LLAppViewer::initWindow()
{
	LL_INFOS("AppInit") << "Initializing window..." << LL_ENDL;

	// store setting in a global for easy access and modification
	gNoRender = gSavedSettings.getBOOL("DisableRendering");

	// Hide the splash screen
	LLSplashScreen::hide();

	// always start windowed
	BOOL ignorePixelDepth = gSavedSettings.getBOOL("IgnorePixelDepth");
	gViewerWindow = new LLViewerWindow(gWindowTitle, "Meerkat",
		gSavedSettings.getS32("WindowX"), gSavedSettings.getS32("WindowY"),
		gSavedSettings.getS32("WindowWidth"), gSavedSettings.getS32("WindowHeight"),
		FALSE, ignorePixelDepth);
		
	if (gSavedSettings.getBOOL("FullScreen"))
	{
		gViewerWindow->toggleFullscreen(FALSE);
			// request to go full screen... which will be delayed until login
	}
	
	if (gSavedSettings.getBOOL("WindowMaximized"))
	{
		gViewerWindow->mWindow->maximize();
		gViewerWindow->getWindow()->setNativeAspectRatio(gSavedSettings.getF32("FullScreenAspectRatio"));
	}

	if (!gNoRender)
	{
		//
		// Initialize GL stuff
		//

		// Set this flag in case we crash while initializing GL
		gSavedSettings.setBOOL("RenderInitError", TRUE);
		gSavedSettings.saveToFile( gSavedSettings.getString("ClientSettingsFile"), TRUE );
	
		gPipeline.init();
		stop_glerror();
		gViewerWindow->initGLDefaults();

		gSavedSettings.setBOOL("RenderInitError", FALSE);
		gSavedSettings.saveToFile( gSavedSettings.getString("ClientSettingsFile"), TRUE );
	}

	//If we have a startup crash, it's usually near GL initialization, so simulate that.
	if(gCrashOnStartup)
	{
		LLAppViewer::instance()->forceErrorLLError();
	}

	LLUI::sWindow = gViewerWindow->getWindow();

	LLAlertDialog::parseAlerts("alerts.xml");
	LLNotifyBox::parseNotify("notify.xml");
	LLTrans::parseStrings("strings.xml");

	// Show watch cursor
	gViewerWindow->setCursor(UI_CURSOR_WAIT);

	// Finish view initialization
	gViewerWindow->initBase();

	// show viewer window
	gViewerWindow->mWindow->show();

	
	return true;
}

void LLAppViewer::writeDebugInfo()
{
	std::string debug_filename = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,"debug_info.log");
	llinfos << "Opening debug file " << debug_filename << llendl;
	llofstream out_file(debug_filename);
	LLSDSerialize::toPrettyXML(gDebugInfo, out_file);
	out_file.close();
}

void LLAppViewer::cleanupSavedSettings()
{
	gSavedSettings.setBOOL("MouseSun", FALSE);

	gSavedSettings.setBOOL("FlyBtnState", FALSE);

	gSavedSettings.setBOOL("FirstPersonBtnState", FALSE);
	gSavedSettings.setBOOL("ThirdPersonBtnState", TRUE);
	gSavedSettings.setBOOL("BuildBtnState", FALSE);

	gSavedSettings.setBOOL("UseEnergy", TRUE);				// force toggle to turn off, since sends message to simulator

	gSavedSettings.setBOOL("DebugWindowProc", gDebugWindowProc);
		
	gSavedSettings.setBOOL("AllowIdleAFK", gAllowIdleAFK);
	gSavedSettings.setBOOL("AllowTapTapHoldRun", gAllowTapTapHoldRun);
	gSavedSettings.setBOOL("ShowObjectUpdates", gShowObjectUpdates);
	
	if (!gNoRender)
	{
		if (gDebugView)
		{
			gSavedSettings.setBOOL("ShowDebugConsole", gDebugView->mDebugConsolep->getVisible());
			gSavedSettings.setBOOL("ShowDebugStats", gDebugView->mFloaterStatsp->getVisible());
		}
	}

	// save window position if not fullscreen
	// as we don't track it in callbacks
	BOOL fullscreen = gViewerWindow->mWindow->getFullscreen();
	BOOL maximized = gViewerWindow->mWindow->getMaximized();
	if (!fullscreen && !maximized)
	{
		LLCoordScreen window_pos;

		if (gViewerWindow->mWindow->getPosition(&window_pos))
		{
			gSavedSettings.setS32("WindowX", window_pos.mX);
			gSavedSettings.setS32("WindowY", window_pos.mY);
		}
	}

	gSavedSettings.setF32("MapScale", LLWorldMapView::sMapScale );
	gSavedSettings.setBOOL("AsyncKeyboard", gHandleKeysAsync);
	gSavedSettings.setBOOL("ShowHoverTips", LLHoverView::sShowHoverTips);

	// Some things are cached in LLAgent.
	if (gAgent.mInitialized)
	{
		gSavedSettings.setF32("RenderFarClip", gAgent.mDrawDistance);
	}
}

void LLAppViewer::removeCacheFiles(const std::string& file_mask)
{
	std::string mask = gDirUtilp->getDirDelimiter() + file_mask;
	gDirUtilp->deleteFilesInDir(gDirUtilp->getExpandedFilename(LL_PATH_CACHE, ""), mask);
}

void LLAppViewer::writeSystemInfo()
{
	gDebugInfo["SLLog"] = LLError::logFileName();

	gDebugInfo["ClientInfo"]["Name"] = gSavedSettings.getString("VersionChannelName");
	gDebugInfo["ClientInfo"]["MajorVersion"] = LL_VERSION_MAJOR;
	gDebugInfo["ClientInfo"]["MinorVersion"] = LL_VERSION_MINOR;
	gDebugInfo["ClientInfo"]["PatchVersion"] = LL_VERSION_PATCH;
	gDebugInfo["ClientInfo"]["BuildVersion"] = LL_VERSION_BUILD;

	gDebugInfo["CAFilename"] = gDirUtilp->getCAFile();

	gDebugInfo["CPUInfo"]["CPUString"] = gSysCPU.getCPUString();
	gDebugInfo["CPUInfo"]["CPUFamily"] = gSysCPU.getFamily();
	gDebugInfo["CPUInfo"]["CPUMhz"] = gSysCPU.getMhz();
	gDebugInfo["CPUInfo"]["CPUAltivec"] = gSysCPU.hasAltivec();
	gDebugInfo["CPUInfo"]["CPUSSE"] = gSysCPU.hasSSE();
	gDebugInfo["CPUInfo"]["CPUSSE2"] = gSysCPU.hasSSE2();
	
	gDebugInfo["RAMInfo"]["Physical"] = (LLSD::Integer)(gSysMemory.getPhysicalMemoryKB());
	gDebugInfo["RAMInfo"]["Allocated"] = (LLSD::Integer)(gMemoryAllocated>>10); // MB -> KB
	gDebugInfo["OSInfo"] = getOSInfo().getOSStringSimple();
		
	// The user is not logged on yet, but record the current grid choice login url
	// which may have been the intended grid. This can b
	gDebugInfo["GridName"] = LLViewerLogin::getInstance()->getGridLabel();

	// *FIX:Mani - move this ddown in llappviewerwin32
#ifdef LL_WINDOWS
	DWORD thread_id = GetCurrentThreadId();
	gDebugInfo["MainloopThreadID"] = (S32)thread_id;
#endif

	// "CrashNotHandled" is set here, while things are running well,
	// in case of a freeze. If there is a freeze, the crash logger will be launched
	// and can read this value from the debug_info.log.
	// If the crash is handled by LLAppViewer::handleViewerCrash, ie not a freeze,
	// then the value of "CrashNotHandled" will be set to true.
	gDebugInfo["CrashNotHandled"] = (LLSD::Boolean)true;
	
	// Dump some debugging info
	LL_INFOS("SystemInfo") << gSecondLife
			<< " version " << LL_VERSION_MAJOR << "." << LL_VERSION_MINOR << "." << LL_VERSION_PATCH
			<< LL_ENDL;

	// Dump the local time and time zone
	time_t now;
	time(&now);
	char tbuffer[256];		/* Flawfinder: ignore */
	strftime(tbuffer, 256, "%Y-%m-%dT%H:%M:%S %Z", localtime(&now));
	LL_INFOS("SystemInfo") << "Local time: " << tbuffer << LL_ENDL;

	// query some system information
	LL_INFOS("SystemInfo") << "CPU info:\n" << gSysCPU << LL_ENDL;
	LL_INFOS("SystemInfo") << "Memory info:\n" << gSysMemory << LL_ENDL;
	LL_INFOS("SystemInfo") << "OS: " << getOSInfo().getOSStringSimple() << LL_ENDL;
	LL_INFOS("SystemInfo") << "OS info: " << getOSInfo() << LL_ENDL;

	writeDebugInfo(); // Save out debug_info.log early, in case of crash.
}

void LLAppViewer::handleSyncViewerCrash()
{
	LLAppViewer* pApp = LLAppViewer::instance();
	// Call to pure virtual, handled by platform specific llappviewer instance.
	pApp->handleSyncCrashTrace(); 
}

void LLAppViewer::handleViewerCrash()
{
	llinfos << "Handle viewer crash entry." << llendl;

	LLAppViewer* pApp = LLAppViewer::instance();
	if (pApp->beingDebugged())
	{
		// This will drop us into the debugger.
		abort();
	}

	// Returns whether a dialog was shown.
	// Only do the logic in here once
	if (pApp->mReportedCrash)
	{
		return;
	}
	pApp->mReportedCrash = TRUE;

	// Make sure the watchdog gets turned off...
// 	pApp->destroyMainloopTimeout(); // SJB: Bah. This causes the crash handler to hang, not sure why.
	
	//We already do this in writeSystemInfo(), but we do it again here to make /sure/ we have a version
	//to check against no matter what
	gDebugInfo["ClientInfo"]["Name"] = gSavedSettings.getString("VersionChannelName");

	gDebugInfo["ClientInfo"]["MajorVersion"] = LL_VERSION_MAJOR;
	gDebugInfo["ClientInfo"]["MinorVersion"] = LL_VERSION_MINOR;
	gDebugInfo["ClientInfo"]["PatchVersion"] = LL_VERSION_PATCH;
	gDebugInfo["ClientInfo"]["BuildVersion"] = LL_VERSION_BUILD;

	LLParcel* parcel = LLViewerParcelMgr::getInstance()->getAgentParcel();
	if ( parcel && parcel->getMusicURL()[0])
	{
		gDebugInfo["ParcelMusicURL"] = parcel->getMusicURL();
	}	
	if ( parcel && parcel->getMediaURL()[0])
	{
		gDebugInfo["ParcelMediaURL"] = parcel->getMediaURL();
	}
	
	
	gDebugInfo["SettingsFilename"] = gSavedSettings.getString("ClientSettingsFile");
	gDebugInfo["CAFilename"] = gDirUtilp->getCAFile();
	gDebugInfo["ViewerExePath"] = gDirUtilp->getExecutablePathAndName();
	gDebugInfo["CurrentPath"] = gDirUtilp->getCurPath();
	gDebugInfo["SessionLength"] = F32(LLFrameTimer::getElapsedSeconds());
	gDebugInfo["StartupState"] = LLStartUp::getStartupStateString();
	gDebugInfo["RAMInfo"]["Allocated"] = (LLSD::Integer) getCurrentRSS() >> 10;

	if(gLogoutInProgress)
	{
		gDebugInfo["LastExecEvent"] = LAST_EXEC_LOGOUT_CRASH;
	}
	else
	{
		gDebugInfo["LastExecEvent"] = gLLErrorActivated ? LAST_EXEC_LLERROR_CRASH : LAST_EXEC_OTHER_CRASH;
	}

	if(gAgent.getRegion())
	{
		gDebugInfo["CurrentSimHost"] = gAgent.getRegionHost().getHostName();
		gDebugInfo["CurrentRegion"] = gAgent.getRegion()->getName();
		
		const LLVector3& loc = gAgent.getPositionAgent();
		gDebugInfo["CurrentLocationX"] = loc.mV[0];
		gDebugInfo["CurrentLocationY"] = loc.mV[1];
		gDebugInfo["CurrentLocationZ"] = loc.mV[2];
	}

	if(LLAppViewer::instance()->mMainloopTimeout)
	{
		gDebugInfo["MainloopTimeoutState"] = LLAppViewer::instance()->mMainloopTimeout->getState();
	}
	
	// The crash is being handled here so set this value to false.
	// Otherwise the crash logger will think this crash was a freeze.
	gDebugInfo["CrashNotHandled"] = (LLSD::Boolean)false;
    
	//Write out the crash status file
	//Use marker file style setup, as that's the simplest, especially since
	//we're already in a crash situation	
	if (gDirUtilp)
	{
		std::string crash_file_name;
		if(gLLErrorActivated) crash_file_name = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,LLERROR_MARKER_FILE_NAME);
		else crash_file_name = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,ERROR_MARKER_FILE_NAME);
		llinfos << "Creating crash marker file " << crash_file_name << llendl;
		
		LLAPRFile crash_file ;
		crash_file.open(crash_file_name, LL_APR_W, LLAPRFile::local);
		if (crash_file.getFileHandle())
		{
			LL_INFOS("MarkerFile") << "Created crash marker file " << crash_file_name << LL_ENDL;
		}
		else
		{
			LL_WARNS("MarkerFile") << "Cannot create error marker file " << crash_file_name << LL_ENDL;
		}		
	}
	
	if (gMessageSystem && gDirUtilp)
	{
		std::string filename;
		filename = gDirUtilp->getExpandedFilename(LL_PATH_LOGS, "stats.log");
		llofstream file(filename, llofstream::binary);
		if(file.good())
		{
			llinfos << "Handle viewer crash generating stats log." << llendl;
			gMessageSystem->summarizeLogs(file);
			file.close();
		}
	}

	if (gMessageSystem)
	{
		gMessageSystem->getCircuitInfo(gDebugInfo["CircuitInfo"]);
		gMessageSystem->stopLogging();
	}

	LLWorld::getInstance()->getInfo(gDebugInfo);

	// Close the debug file
	pApp->writeDebugInfo();

	LLError::logToFile("");

	// Remove the marker file, since otherwise we'll spawn a process that'll keep it locked
	if(gDebugInfo["LastExecEvent"].asInteger() == LAST_EXEC_LOGOUT_CRASH)
	{
		pApp->removeMarkerFile(true);
	}
	else
	{
		pApp->removeMarkerFile(false);
	}
	
	// Call to pure virtual, handled by platform specific llappviewer instance.
	pApp->handleCrashReporting(); 

	return;
}

bool LLAppViewer::anotherInstanceRunning()
{
	// We create a marker file when the program starts and remove the file when it finishes.
	// If the file is currently locked, that means another process is already running.

	std::string marker_file = gDirUtilp->getExpandedFilename(LL_PATH_LOGS, MARKER_FILE_NAME);
	LL_DEBUGS("MarkerFile") << "Checking marker file for lock..." << LL_ENDL;

	//Freeze case checks
	if (LLAPRFile::isExist(marker_file, LL_APR_RB))
	{
		// File exists, try opening with write permissions
		LLAPRFile outfile ;
		outfile.open(marker_file, LL_APR_WB, LLAPRFile::global);
		apr_file_t* fMarker = outfile.getFileHandle() ; 
		if (!fMarker)
		{
			// Another instance is running. Skip the rest of these operations.
			LL_INFOS("MarkerFile") << "Marker file is locked." << LL_ENDL;
			return true;
		}
		if (apr_file_lock(fMarker, APR_FLOCK_NONBLOCK | APR_FLOCK_EXCLUSIVE) != APR_SUCCESS) //flock(fileno(fMarker), LOCK_EX | LOCK_NB) == -1)
		{
			LL_INFOS("MarkerFile") << "Marker file is locked." << LL_ENDL;
			return true;
		}
		// No other instances; we'll lock this file now & delete on quit.		
	}
	LL_DEBUGS("MarkerFile") << "Marker file isn't locked." << LL_ENDL;
	return false;
}

void LLAppViewer::initMarkerFile()
{
	//First, check for the existence of other files.
	//There are marker files for two different types of crashes
	
	mMarkerFileName = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,MARKER_FILE_NAME);
	LL_DEBUGS("MarkerFile") << "Checking marker file for lock..." << LL_ENDL;

	//We've got 4 things to test for here
	// - Other Process Running (SecondLife.exec_marker present, locked)
	// - Freeze (SecondLife.exec_marker present, not locked)
	// - LLError Crash (SecondLife.llerror_marker present)
	// - Other Crash (SecondLife.error_marker present)
	// These checks should also remove these files for the last 2 cases if they currently exist

	//LLError/Error checks. Only one of these should ever happen at a time.
	std::string logout_marker_file =  gDirUtilp->getExpandedFilename(LL_PATH_LOGS, LOGOUT_MARKER_FILE_NAME);
	std::string llerror_marker_file = gDirUtilp->getExpandedFilename(LL_PATH_LOGS, LLERROR_MARKER_FILE_NAME);
	std::string error_marker_file = gDirUtilp->getExpandedFilename(LL_PATH_LOGS, ERROR_MARKER_FILE_NAME);

	
	if (LLAPRFile::isExist(mMarkerFileName, LL_APR_RB) && !anotherInstanceRunning())
	{
		gLastExecEvent = LAST_EXEC_FROZE;
		LL_INFOS("MarkerFile") << "Exec marker found: program froze on previous execution" << LL_ENDL;
	}    
    
	if(LLAPRFile::isExist(logout_marker_file, LL_APR_RB))
	{
		LL_INFOS("MarkerFile") << "Last exec LLError crashed, setting LastExecEvent to " << LAST_EXEC_LLERROR_CRASH << LL_ENDL;
		gLastExecEvent = LAST_EXEC_LOGOUT_FROZE;
	}
	if(LLAPRFile::isExist(llerror_marker_file, LL_APR_RB))
	{
		llinfos << "Last exec LLError crashed, setting LastExecEvent to " << LAST_EXEC_LLERROR_CRASH << llendl;
		if(gLastExecEvent == LAST_EXEC_LOGOUT_FROZE) gLastExecEvent = LAST_EXEC_LOGOUT_CRASH;
		else gLastExecEvent = LAST_EXEC_LLERROR_CRASH;
	}
	if(LLAPRFile::isExist(error_marker_file, LL_APR_RB))
	{
		LL_INFOS("MarkerFile") << "Last exec crashed, setting LastExecEvent to " << LAST_EXEC_OTHER_CRASH << LL_ENDL;
		if(gLastExecEvent == LAST_EXEC_LOGOUT_FROZE) gLastExecEvent = LAST_EXEC_LOGOUT_CRASH;
		else gLastExecEvent = LAST_EXEC_OTHER_CRASH;
	}
	
	LLAPRFile::remove(logout_marker_file);
	LLAPRFile::remove(llerror_marker_file);
	LLAPRFile::remove(error_marker_file);
	
	// No new markers if another instance is running.
	if(anotherInstanceRunning()) 
	{
		return;
	}
	
	// Create the marker file for this execution & lock it
	apr_status_t s;
	s = mMarkerFile.open(mMarkerFileName, LL_APR_W, LLAPRFile::global);

	if (s == APR_SUCCESS && mMarkerFile.getFileHandle())
	{
		LL_DEBUGS("MarkerFile") << "Marker file created." << LL_ENDL;
	}
	else
	{
		LL_INFOS("MarkerFile") << "Failed to create marker file." << LL_ENDL;
		return;
	}
	if (apr_file_lock(mMarkerFile.getFileHandle(), APR_FLOCK_NONBLOCK | APR_FLOCK_EXCLUSIVE) != APR_SUCCESS) 
	{
		mMarkerFile.close() ;
		LL_INFOS("MarkerFile") << "Marker file cannot be locked." << LL_ENDL;
		return;
	}

	LL_DEBUGS("MarkerFile") << "Marker file locked." << LL_ENDL;
}

void LLAppViewer::removeMarkerFile(bool leave_logout_marker)
{
	LL_DEBUGS("MarkerFile") << "removeMarkerFile()" << LL_ENDL;
	if (mMarkerFile.getFileHandle())
	{
		mMarkerFile.close() ;
		LLAPRFile::remove( mMarkerFileName );
	}
	if (mLogoutMarkerFile != NULL && !leave_logout_marker)
	{
		LLAPRFile::remove( mLogoutMarkerFileName );
		mLogoutMarkerFile = NULL;
	}
}


//this gets called after we get a packet back from the
//server saying we are logged out, or if the packet times
//out
void LLAppViewer::forceQuit()
{ 

	LL_INFOS("forceQuit") << "Destroying the entire world" << LL_ENDL;
	if (mQuitRequested)
		LLApp::setQuitting(); 
	else
	{
		if (mLogoutRequested) //we just finished a logout request
		{
			//LLStartUp::setStartupState( STATE_LOGIN_SHOW );
			LLStartUp::resetLogin();
			cleanup();
			mLogoutRequested=false;
			mLogoutRequestSent=false;
		}
	}
}

void LLAppViewer::requestLogout(bool quit_after)
{

	mLogoutRequested=true;
	if(quit_after)
		mQuitRequested=true;
	else
		mQuitRequested=false;

	llinfos << "requestLogout" << llendl;

	LLViewerRegion* region = gAgent.getRegion();
	
	if( (LLStartUp::getStartupState() >= STATE_STARTED) && region )
	{
		LLHUDEffectSpiral *effectp = (LLHUDEffectSpiral*)LLHUDManager::getInstance()->createViewerEffect(LLHUDObject::LL_HUD_EFFECT_POINT, TRUE);
		effectp->setPositionGlobal(gAgent.getPositionGlobal());
		effectp->setColor(LLColor4U(gAgent.getEffectColor()));
		LLHUDManager::getInstance()->sendEffects();
		send_stats();
	}
	else
	{
		mQuitRequested=true;
		LLAppViewer::instance()->forceQuit();
	}

	// Attempt to close all floaters that might be
	// editing things.
	if (gFloaterView)
	{
		// application is quitting
		gFloaterView->closeAllChildren(true);
	}

	gLogoutTimer.reset();
}

static void finish_quit(S32 option, void *userdata)
{
	if (option == 0)
	{
		LLAppViewer::instance()->requestLogout(true);
	}
}

void LLAppViewer::userQuit()
{
	gViewerWindow->alertXml("ConfirmQuit", finish_quit, NULL);
}

//static
void LLAppViewer::userLogout(void *userdata)
{
	LLAppViewer::instance()->requestLogout(false);
}

static void finish_early_exit(S32 option, void* userdata)
{
	LLAppViewer::instance()->forceQuit();
}

void LLAppViewer::earlyExit(const std::string& msg)
{
   	llwarns << "app_early_exit: " << msg << llendl;
	gDoDisconnect = TRUE;
// 	LLStringUtil::format_map_t args;
// 	args["[MESSAGE]"] = mesg;
// 	gViewerWindow->alertXml("AppEarlyExit", args, finish_early_exit);
	LLAlertDialog::showCritical(msg, finish_early_exit, NULL);
}

void LLAppViewer::forceExit(S32 arg)
{
    removeMarkerFile();
    
    // *FIX:Mani - This kind of exit hardly seems appropriate.
    exit(arg);
}

void LLAppViewer::abortQuit()
{
    llinfos << "abortQuit()" << llendl;
	mQuitRequested = false;
	mLogoutRequested = false;
}

bool LLAppViewer::initCache()
{
	mPurgeCache = false;
	// Purge cache if user requested it
	if (gSavedSettings.getBOOL("PurgeCacheOnStartup") ||
		gSavedSettings.getBOOL("PurgeCacheOnNextStartup"))
	{
		gSavedSettings.setBOOL("PurgeCacheOnNextStartup", false);
		mPurgeCache = true;
	}
	// Purge cache if it belongs to an old version
	else
	{
		static const S32 cache_version = 5;
		if (gSavedSettings.getS32("LocalCacheVersion") != cache_version)
		{
			mPurgeCache = true;
			gSavedSettings.setS32("LocalCacheVersion", cache_version);
		}
	}
	
	// Delete old cache directory
#ifdef LL_DARWIN
	if (LL_VERSION_MAJOR >= 1 && LL_VERSION_MINOR >= 21)
	{
		if (gLastRunVersion != gCurrentVersion)
		{
			// NOTE: (Nyx) as of 1.21, cache for mac is moving to /library/caches/SecondLife from
			// /library/application support/SecondLife/cache This should clear/delete the old dir.
			std::string cache_dir = gDirUtilp->getOSUserAppDir();
			std::string new_cache_dir = gDirUtilp->getOSCacheDir();
			cache_dir = cache_dir + "/cache";
			new_cache_dir = new_cache_dir + "/" + gSecondLife;
			if (gDirUtilp->fileExists(cache_dir))
			{
				gDirUtilp->setCacheDir(cache_dir);
				purgeCache();
				gDirUtilp->setCacheDir(new_cache_dir);

				std::string ds_store = cache_dir + "/.DS_Store";
				if (gDirUtilp->fileExists(ds_store.c_str()))
				{
					LLFile::remove(ds_store.c_str());
				}
				if (LLFile::remove(cache_dir.c_str()) != 0)
				{
					llwarns << "could not delete old cache directory" << llendl;
				}
			}
		}
	}
#endif

	// Setup and verify the cache location
	std::string cache_location = gSavedSettings.getString("CacheLocation");
	std::string new_cache_location = gSavedSettings.getString("NewCacheLocation");
	if (new_cache_location != cache_location)
	{
		gDirUtilp->setCacheDir(gSavedSettings.getString("CacheLocation"));
		purgeCache(); // purge old cache
		gSavedSettings.setString("CacheLocation", new_cache_location);
	}
	
	if (!gDirUtilp->setCacheDir(gSavedSettings.getString("CacheLocation")))
	{
		LL_WARNS("AppCache") << "Unable to set cache location" << LL_ENDL;
		gSavedSettings.setString("CacheLocation", "");
	}
	
	if (mPurgeCache)
	{
		LLSplashScreen::update("Clearing cache...");
		purgeCache();
	}

	LLSplashScreen::update("Initializing Texture Cache...");
	
	// Init the texture cache
	// Allocate 80% of the cache size for textures
	BOOL read_only = mSecondInstance ? TRUE : FALSE;
	const S32 MB = 1024*1024;
	S64 cache_size = (S64)(gSavedSettings.getU32("CacheSize")) * MB;
	const S64 MAX_CACHE_SIZE = 1024*MB;
	cache_size = llmin(cache_size, MAX_CACHE_SIZE);
	S64 texture_cache_size = ((cache_size * 8)/10);
	S64 extra = LLAppViewer::getTextureCache()->initCache(LL_PATH_CACHE, texture_cache_size, read_only);
	texture_cache_size -= extra;

	LLSplashScreen::update("Initializing VFS...");
	
	// Init the VFS
	S64 vfs_size = cache_size - texture_cache_size;
	const S64 MAX_VFS_SIZE = 1024 * MB; // 1 GB
	vfs_size = llmin(vfs_size, MAX_VFS_SIZE);
	vfs_size = (vfs_size / MB) * MB; // make sure it is MB aligned
	U32 vfs_size_u32 = (U32)vfs_size;
	U32 old_vfs_size = gSavedSettings.getU32("VFSOldSize") * MB;
	bool resize_vfs = (vfs_size_u32 != old_vfs_size);
	if (resize_vfs)
	{
		gSavedSettings.setU32("VFSOldSize", vfs_size_u32/MB);
	}
	LL_INFOS("AppCache") << "VFS CACHE SIZE: " << vfs_size/(1024*1024) << " MB" << LL_ENDL;
	
	// This has to happen BEFORE starting the vfs
	//time_t	ltime;
	srand(time(NULL));		// Flawfinder: ignore
	U32 old_salt = gSavedSettings.getU32("VFSSalt");
	U32 new_salt;
	std::string old_vfs_data_file;
	std::string old_vfs_index_file;
	std::string new_vfs_data_file;
	std::string new_vfs_index_file;
	std::string static_vfs_index_file;
	std::string static_vfs_data_file;

	if (gSavedSettings.getBOOL("AllowMultipleViewers"))
	{
		// don't mess with renaming the VFS in this case
		new_salt = old_salt;
	}
	else
	{
		do
		{
			new_salt = rand();
		} while( new_salt == old_salt );
	}

	old_vfs_data_file = gDirUtilp->getExpandedFilename(LL_PATH_CACHE,VFS_DATA_FILE_BASE) + llformat("%u",old_salt);

	// make sure this file exists
	llstat s;
	S32 stat_result = LLFile::stat(old_vfs_data_file, &s);
	if (stat_result)
	{
		// doesn't exist, look for a data file
		std::string mask;
		mask = gDirUtilp->getDirDelimiter();
		mask += VFS_DATA_FILE_BASE;
		mask += "*";

		std::string dir;
		dir = gDirUtilp->getExpandedFilename(LL_PATH_CACHE,"");

		std::string found_file;
		if (gDirUtilp->getNextFileInDir(dir, mask, found_file, false))
		{
			old_vfs_data_file = dir + gDirUtilp->getDirDelimiter() + found_file;

			S32 start_pos = found_file.find_last_of('.');
			if (start_pos > 0)
			{
				sscanf(found_file.substr(start_pos+1).c_str(), "%d", &old_salt);
			}
			LL_DEBUGS("AppCache") << "Default vfs data file not present, found: " << old_vfs_data_file << " Old salt: " << old_salt << llendl;
		}
	}

	old_vfs_index_file = gDirUtilp->getExpandedFilename(LL_PATH_CACHE,VFS_INDEX_FILE_BASE) + llformat("%u",old_salt);

	stat_result = LLFile::stat(old_vfs_index_file, &s);
	if (stat_result)
	{
		// We've got a bad/missing index file, nukem!
		LL_WARNS("AppCache") << "Bad or missing vfx index file " << old_vfs_index_file << LL_ENDL;
		LL_WARNS("AppCache") << "Removing old vfs data file " << old_vfs_data_file << LL_ENDL;
		LLFile::remove(old_vfs_data_file);
		LLFile::remove(old_vfs_index_file);
		
		// Just in case, nuke any other old cache files in the directory.
		std::string dir;
		dir = gDirUtilp->getExpandedFilename(LL_PATH_CACHE,"");

		std::string mask;
		mask = gDirUtilp->getDirDelimiter();
		mask += VFS_DATA_FILE_BASE;
		mask += "*";

		gDirUtilp->deleteFilesInDir(dir, mask);

		mask = gDirUtilp->getDirDelimiter();
		mask += VFS_INDEX_FILE_BASE;
		mask += "*";

		gDirUtilp->deleteFilesInDir(dir, mask);
	}

	new_vfs_data_file = gDirUtilp->getExpandedFilename(LL_PATH_CACHE,VFS_DATA_FILE_BASE) + llformat("%u",new_salt);
	new_vfs_index_file = gDirUtilp->getExpandedFilename(LL_PATH_CACHE, VFS_INDEX_FILE_BASE) + llformat("%u",new_salt);

	static_vfs_data_file = gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS,"static_data.db2");
	static_vfs_index_file = gDirUtilp->getExpandedFilename(LL_PATH_APP_SETTINGS,"static_index.db2");

	if (resize_vfs)
	{
		LL_DEBUGS("AppCache") << "Removing old vfs and re-sizing" << LL_ENDL;
		
		LLFile::remove(old_vfs_data_file);
		LLFile::remove(old_vfs_index_file);
	}
	else if (old_salt != new_salt)
	{
		// move the vfs files to a new name before opening
		LL_DEBUGS("AppCache") << "Renaming " << old_vfs_data_file << " to " << new_vfs_data_file << LL_ENDL;
		LL_DEBUGS("AppCache") << "Renaming " << old_vfs_index_file << " to " << new_vfs_index_file << LL_ENDL;
		LLFile::rename(old_vfs_data_file, new_vfs_data_file);
		LLFile::rename(old_vfs_index_file, new_vfs_index_file);
	}

	// Startup the VFS...
	gSavedSettings.setU32("VFSSalt", new_salt);

	// Don't remove VFS after viewer crashes.  If user has corrupt data, they can reinstall. JC
	gVFS = new LLVFS(new_vfs_index_file, new_vfs_data_file, false, vfs_size_u32, false);
	if( VFSVALID_BAD_CORRUPT == gVFS->getValidState() )
	{
		// Try again with fresh files 
		// (The constructor deletes corrupt files when it finds them.)
		LL_WARNS("AppCache") << "VFS corrupt, deleted.  Making new VFS." << LL_ENDL;
		delete gVFS;
		gVFS = new LLVFS(new_vfs_index_file, new_vfs_data_file, false, vfs_size_u32, false);
	}

	gStaticVFS = new LLVFS(static_vfs_index_file, static_vfs_data_file, true, 0, false);

	BOOL success = gVFS->isValid() && gStaticVFS->isValid();
	if( !success )
	{
		return false;
	}
	else
	{
		LLVFile::initClass();
		return true;
	}
}

void LLAppViewer::purgeCache()
{
	LL_INFOS("AppCache") << "Purging Cache and Texture Cache..." << llendl;
	LLAppViewer::getTextureCache()->purgeCache(LL_PATH_CACHE);
	std::string mask = gDirUtilp->getDirDelimiter() + "*.*";
	gDirUtilp->deleteFilesInDir(gDirUtilp->getExpandedFilename(LL_PATH_CACHE,""),mask);
}

const std::string& LLAppViewer::getSecondLifeTitle() const
{
	return gSecondLife;
}

const std::string& LLAppViewer::getWindowTitle() const 
{
	return gWindowTitle;
}

// Callback from a dialog indicating user was logged out.  
void finish_disconnect(S32 option, void* userdata)
{
	if (1 == option)
	{
        LLAppViewer::instance()->forceQuit();
	}
}

// Callback from an early disconnect dialog, force an exit
void finish_forced_disconnect(S32 /* option */, void* /* userdata */)
{
	LLAppViewer::instance()->forceQuit();
}


void LLAppViewer::forceDisconnect(const std::string& mesg)
{
	if (gDoDisconnect||mQuitRequested||mLogoutRequested)
    {
		// Already popped up one of these dialogs, don't
		// do this again.
		return;
    }
	
	// Translate the message if possible
	std::string big_reason = LLAgent::sTeleportErrorMessages[mesg];
	if ( big_reason.size() == 0 )
	{
		big_reason = mesg;
	}

	LLStringUtil::format_map_t args;
	gDoDisconnect = TRUE;

	if (LLStartUp::getStartupState() < STATE_STARTED)
	{
		// Tell users what happened
		args["[ERROR_MESSAGE]"] = big_reason;
		gViewerWindow->alertXml("ErrorMessage", args, finish_forced_disconnect);
	}
	else
	{
		args["[MESSAGE]"] = big_reason;
		gViewerWindow->alertXml("YouHaveBeenLoggedOut", args, finish_disconnect );
	}
}

void LLAppViewer::badNetworkHandler()
{
	// Dump the packet
	gMessageSystem->dumpPacketToLog();

	// Flush all of our caches on exit in the case of disconnect due to
	// invalid packets.

	mPurgeOnExit = TRUE;

#if LL_WINDOWS
	// Generates the minidump.
	LLWinDebug::generateCrashStacks(NULL);
#endif
	LLAppViewer::handleSyncViewerCrash();
	LLAppViewer::handleViewerCrash();

	std::ostringstream message;
	message <<
		"The viewer has detected mangled network data indicative\n"
		"of a bad upstream network connection or an incomplete\n"
		"local installation of " << LLAppViewer::instance()->getSecondLifeTitle() << ". \n"
		" \n"
		"Try uninstalling and reinstalling to see if this resolves \n"
		"the issue. \n"
		" \n"
		"If the problem continues, see the Tech Support FAQ at: \n"
		"www.secondlife.com/support";
	forceDisconnect(message.str());
}

// This routine may get called more than once during the shutdown process.
// This can happen because we need to get the screenshot before the window
// is destroyed.
void LLAppViewer::saveFinalSnapshot()
{
	if (!mSavedFinalSnapshot && !gNoRender)
	{
		gSavedSettings.setVector3d("FocusPosOnLogout", gAgent.calcFocusPositionTargetGlobal());
		gSavedSettings.setVector3d("CameraPosOnLogout", gAgent.calcCameraPositionTargetGlobal());
		gViewerWindow->setCursor(UI_CURSOR_WAIT);
		gAgent.changeCameraToThirdPerson( FALSE );	// don't animate, need immediate switch
		gSavedSettings.setBOOL("ShowParcelOwners", FALSE);
		idle();

		std::string snap_filename = gDirUtilp->getLindenUserDir();
		snap_filename += gDirUtilp->getDirDelimiter();
		snap_filename += SCREEN_LAST_FILENAME;
		// use full pixel dimensions of viewer window (not post-scale dimensions)
		gViewerWindow->saveSnapshot(snap_filename, gViewerWindow->getWindowDisplayWidth(), gViewerWindow->getWindowDisplayHeight(), FALSE, TRUE);
		mSavedFinalSnapshot = TRUE;
	}
}

void LLAppViewer::loadNameCache()
{
	if (!gCacheName) return;

	std::string name_cache;
	name_cache = gDirUtilp->getExpandedFilename(LL_PATH_CACHE, "name.cache");
	llifstream cache_file(name_cache);
	if(cache_file.is_open())
	{
		if(gCacheName->importFile(cache_file)) return;
	}

	// Try to load from the legacy format. This should go away after a
	// while. Phoenix 2008-01-30
	LLFILE* name_cache_fp = LLFile::fopen(name_cache, "r");		// Flawfinder: ignore
	if (name_cache_fp)
	{
		gCacheName->importFile(name_cache_fp);
		fclose(name_cache_fp);
	}
}

void LLAppViewer::saveNameCache()
{
	if (!gCacheName) return;

	std::string name_cache;
	name_cache = gDirUtilp->getExpandedFilename(LL_PATH_CACHE, "name.cache");
	llofstream cache_file(name_cache);
	if(cache_file.is_open())
	{
		gCacheName->exportFile(cache_file);
	}
}

/*!	@brief		This class is an LLFrameTimer that can be created with
				an elapsed time that starts counting up from the given value
				rather than 0.0.
				
				Otherwise it behaves the same way as LLFrameTimer.
*/
class LLFrameStatsTimer : public LLFrameTimer
{
public:
	LLFrameStatsTimer(F64 elapsed_already = 0.0)
		: LLFrameTimer()
		{
			mStartTime -= elapsed_already;
		}
};

///////////////////////////////////////////////////////
// idle()
//
// Called every time the window is not doing anything.
// Receive packets, update statistics, and schedule a redisplay.
///////////////////////////////////////////////////////
void LLAppViewer::idle()
{
	pingMainloopTimeout("Main:Idle");
	
	// Update frame timers
	static LLTimer idle_timer;

	LLFrameTimer::updateFrameTime();
	LLFrameTimer::updateFrameCount();
	LLEventTimer::updateClass();
	LLCriticalDamp::updateInterpolants();
	LLMortician::updateClass();
	F32 dt_raw = idle_timer.getElapsedTimeAndResetF32();

	// Cap out-of-control frame times
	// Too low because in menus, swapping, debugger, etc.
	// Too high because idle called with no objects in view, etc.
	const F32 MIN_FRAME_RATE = 1.f;
	const F32 MAX_FRAME_RATE = 200.f;

	F32 frame_rate_clamped = 1.f / dt_raw;
	frame_rate_clamped = llclamp(frame_rate_clamped, MIN_FRAME_RATE, MAX_FRAME_RATE);
	gFrameDTClamped = 1.f / frame_rate_clamped;

	// Global frame timer
	// Smoothly weight toward current frame
	gFPSClamped = (frame_rate_clamped + (4.f * gFPSClamped)) / 5.f;

	F32 qas = gSavedSettings.getF32("QuitAfterSeconds");
	if (qas > 0.f)
	{
		if (gRenderStartTime.getElapsedTimeF32() > qas)
		{
			LLAppViewer::instance()->forceQuit();
		}
	}

	// Must wait until both have avatar object and mute list, so poll
	// here.
	request_initial_instant_messages();

	///////////////////////////////////
	//
	// Special case idle if still starting up
	//

	if (LLStartUp::getStartupState() < STATE_STARTED)
	{
		// Skip rest if idle startup returns false (essentially, no world yet)
		if (!idle_startup())
		{
			return;
		}
	}

	
    F32 yaw = 0.f;				// radians

	if (!gDisconnected)
	{
		LLFastTimer t(LLFastTimer::FTM_NETWORK);
		// Update spaceserver timeinfo
	    LLWorld::getInstance()->setSpaceTimeUSec(LLWorld::getInstance()->getSpaceTimeUSec() + (U32)(dt_raw * SEC_TO_MICROSEC));
    
    
	    //////////////////////////////////////
	    //
	    // Update simulator agent state
	    //

		if (gSavedSettings.getBOOL("RotateRight"))
		{
			gAgent.moveYaw(-1.f);
		}

	    // Handle automatic walking towards points
	    gAgentPilot.updateTarget();
	    gAgent.autoPilot(&yaw);
    
	    static LLFrameTimer agent_update_timer;
	    static U32 				last_control_flags;
    
	    //	When appropriate, update agent location to the simulator.
	    F32 agent_update_time = agent_update_timer.getElapsedTimeF32();
	    BOOL flags_changed = gAgent.controlFlagsDirty() || (last_control_flags != gAgent.getControlFlags());
    
	    if (flags_changed || (agent_update_time > (1.0f / (F32) AGENT_UPDATES_PER_SECOND)))
	    {
		    // Send avatar and camera info
		    last_control_flags = gAgent.getControlFlags();
		    //TODO lgg - ok, this is it!  check setting on this thing and only do it if allowd
			
			//if(!gSavedSettings.getBOOL("phantomRightNow"))
			if(!gAgent.getPhantom())
			{
				send_agent_update(TRUE);
			}
		    agent_update_timer.reset();
	    }
	}

	//////////////////////////////////////
	//
	// Manage statistics
	//
	//

	{
		// Initialize the viewer_stats_timer with an already elapsed time
		// of SEND_STATS_PERIOD so that the initial stats report will
		// be sent immediately.
		static LLFrameStatsTimer viewer_stats_timer(SEND_STATS_PERIOD);
		reset_statistics();

		// Update session stats every large chunk of time
		// *FIX: (???) SAMANTHA
		if (viewer_stats_timer.getElapsedTimeF32() >= SEND_STATS_PERIOD && !gDisconnected)
		{
			llinfos << "Transmitting sessions stats" << llendl;
			send_stats();
			viewer_stats_timer.reset();
		}

		// Print the object debugging stats
		static LLFrameTimer object_debug_timer;
		if (object_debug_timer.getElapsedTimeF32() > 5.f)
		{
			object_debug_timer.reset();
			if (gObjectList.mNumDeadObjectUpdates)
			{
				llinfos << "Dead object updates: " << gObjectList.mNumDeadObjectUpdates << llendl;
				gObjectList.mNumDeadObjectUpdates = 0;
			}
			if (gObjectList.mNumUnknownKills)
			{
				llinfos << "Kills on unknown objects: " << gObjectList.mNumUnknownKills << llendl;
				gObjectList.mNumUnknownKills = 0;
			}
			if (gObjectList.mNumUnknownUpdates)
			{
				llinfos << "Unknown object updates: " << gObjectList.mNumUnknownUpdates << llendl;
				gObjectList.mNumUnknownUpdates = 0;
			}
		}
		gFrameStats.addFrameData();
	}
	
	if (!gDisconnected)
	{
		LLFastTimer t(LLFastTimer::FTM_NETWORK);
	
	    ////////////////////////////////////////////////
	    //
	    // Network processing
	    //
	    // NOTE: Starting at this point, we may still have pointers to "dead" objects
	    // floating throughout the various object lists.
	    //
    
	    gFrameStats.start(LLFrameStats::IDLE_NETWORK);
		stop_glerror();
		idleNetwork();
	    stop_glerror();
	        
	    gFrameStats.start(LLFrameStats::AGENT_MISC);

		// Check for away from keyboard, kick idle agents.
		idle_afk_check();

		if (!gDisconnected) //check again
		{
			//  Update statistics for this frame
			update_statistics(gFrameCount);
		}
	}

	////////////////////////////////////////
	//
	// Handle the regular UI idle callbacks as well as
	// hover callbacks
	//

	{
// 		LLFastTimer t(LLFastTimer::FTM_IDLE_CB);

		// Do event notifications if necessary.  Yes, we may want to move this elsewhere.
		gEventNotifier.update();
		
		gIdleCallbacks.callFunctions();
	}
	
	if (gDisconnected)
    {
		return;
    }

	gViewerWindow->handlePerFrameHover();

	///////////////////////////////////////
	// Agent and camera movement
	//
		LLCoordGL current_mouse = gViewerWindow->getCurrentMouse();

	{
		// After agent and camera moved, figure out if we need to
		// deselect objects.
		LLSelectMgr::getInstance()->deselectAllIfTooFar();

	}

	{
		// Handle pending gesture processing
		LLGestureManager::getInstance()->update();

		gAgent.updateAgentPosition(gFrameDTClamped, yaw, current_mouse.mX, current_mouse.mY);
	}

	{
		LLFastTimer t(LLFastTimer::FTM_OBJECTLIST_UPDATE); // Actually "object update"
		gFrameStats.start(LLFrameStats::OBJECT_UPDATE);
		
        if (!(logoutRequestSent() && hasSavedFinalSnapshot()))
		{
			gObjectList.update(gAgent, *LLWorld::getInstance());
		}
	}
	
	//////////////////////////////////////
	//
	// Deletes objects...
	// Has to be done after doing idleUpdates (which can kill objects)
	//

	{
		LLFastTimer t(LLFastTimer::FTM_CLEANUP);
		gFrameStats.start(LLFrameStats::CLEAN_DEAD);
		gObjectList.cleanDeadObjects();
		LLDrawable::cleanupDeadDrawables();
	}
	
	//
	// After this point, in theory we should never see a dead object
	// in the various object/drawable lists.
	//

	//////////////////////////////////////
	//
	// Update/send HUD effects
	//
	// At this point, HUD effects may clean up some references to
	// dead objects.
	//

	{
		gFrameStats.start(LLFrameStats::UPDATE_EFFECTS);
		LLSelectMgr::getInstance()->updateEffects();
		LLHUDManager::getInstance()->cleanupEffects();
		LLHUDManager::getInstance()->sendEffects();
	}

	stop_glerror();

	////////////////////////////////////////
	//
	// Unpack layer data that we've received
	//

	{
		LLFastTimer t(LLFastTimer::FTM_NETWORK);
		gVLManager.unpackData();
	}
	
	/////////////////////////
	//
	// Update surfaces, and surface textures as well.
	//

	LLWorld::getInstance()->updateVisibilities();
	{
		const F32 max_region_update_time = .001f; // 1ms
		LLFastTimer t(LLFastTimer::FTM_REGION_UPDATE);
		LLWorld::getInstance()->updateRegions(max_region_update_time);
	}
	
	/////////////////////////
	//
	// Update weather effects
	//
	if (!gNoRender)
	{
		LLWorld::getInstance()->updateClouds(gFrameDTClamped);
		gSky.propagateHeavenlyBodies(gFrameDTClamped);				// moves sun, moon, and planets

		// Update wind vector 
		LLVector3 wind_position_region;
		static LLVector3 average_wind;

		LLViewerRegion *regionp;
		regionp = LLWorld::getInstance()->resolveRegionGlobal(wind_position_region, gAgent.getPositionGlobal());	// puts agent's local coords into wind_position	
		if (regionp)
		{
			gWindVec = regionp->mWind.getVelocity(wind_position_region);

			// Compute average wind and use to drive motion of water
			
			average_wind = regionp->mWind.getAverage();
			F32 cloud_density = regionp->mCloudLayer.getDensityRegion(wind_position_region);
			
			gSky.setCloudDensityAtAgent(cloud_density);
			gSky.setWind(average_wind);
			//LLVOWater::setWind(average_wind);
		}
		else
		{
			gWindVec.setVec(0.0f, 0.0f, 0.0f);
		}
	}
	stop_glerror();
	
	//////////////////////////////////////
	//
	// Sort and cull in the new renderer are moved to pipeline.cpp
	// Here, particles are updated and drawables are moved.
	//
	
	if (!gNoRender)
	{
		LLFastTimer t(LLFastTimer::FTM_WORLD_UPDATE);
		gFrameStats.start(LLFrameStats::UPDATE_MOVE);
		gPipeline.updateMove();

		gFrameStats.start(LLFrameStats::UPDATE_PARTICLES);
		LLWorld::getInstance()->updateParticles();
	}
	stop_glerror();

	if (LLViewerJoystick::getInstance()->getOverrideCamera())
	{
		LLViewerJoystick::getInstance()->moveFlycam();
	}
	else
	{
		if (LLToolMgr::getInstance()->inBuildMode())
		{
			LLViewerJoystick::getInstance()->moveObjects();
		}

		gAgent.updateCamera();
	}

	// objects and camera should be in sync, do LOD calculations now
	{
		LLFastTimer t(LLFastTimer::FTM_LOD_UPDATE);
		gObjectList.updateApparentAngles(gAgent);
	}

	{
		gFrameStats.start(LLFrameStats::AUDIO);
		LLFastTimer t(LLFastTimer::FTM_AUDIO_UPDATE);
		
		if (gAudiop)
		{
		    audio_update_volume(false);
			audio_update_listener();
			audio_update_wind(false);

			// this line actually commits the changes we've made to source positions, etc.
			const F32 max_audio_decode_time = 0.002f; // 2 ms decode time
			gAudiop->idle(max_audio_decode_time);
		}
	}
	
	// Handle shutdown process, for example, 
	// wait for floaters to close, send quit message,
	// forcibly quit if it has taken too long
	if (mQuitRequested || mLogoutRequested)
	{
		idleShutdown();
	}

	stop_glerror();
}

void LLAppViewer::idleShutdown()
{
	// Wait for all modal alerts to get resolved
	if (LLModalDialog::activeCount() > 0)
	{
		return;
	}

	// close IM interface
	if(gIMMgr)
	{
		gIMMgr->disconnectAllSessions();
	}
	
	// Wait for all floaters to get resolved
	if (gFloaterView
		&& !gFloaterView->allChildrenClosed())
	{
		return;
	}

	static bool saved_snapshot = false;
	if (!saved_snapshot)
	{
		saved_snapshot = true;
		saveFinalSnapshot();
		return;
	}

	const F32 SHUTDOWN_UPLOAD_SAVE_TIME = 5.f;

	S32 pending_uploads = gAssetStorage->getNumPendingUploads();
	if (pending_uploads > 0
		&& gLogoutTimer.getElapsedTimeF32() < SHUTDOWN_UPLOAD_SAVE_TIME
		&& !logoutRequestSent())
	{
		static S32 total_uploads = 0;
		// Sometimes total upload count can change during logout.
		total_uploads = llmax(total_uploads, pending_uploads);
		gViewerWindow->setShowProgress(!gSavedSettings.getBOOL("MeerkatDisableLogoutScreens"));
		S32 finished_uploads = total_uploads - pending_uploads;
		F32 percent = 100.f * finished_uploads / total_uploads;
		gViewerWindow->setProgressPercent(percent);
		gViewerWindow->setProgressString("Saving final data...");
		return;
	}

	// All floaters are closed.  Tell server we want to quit.
	if( !logoutRequestSent() )
	{
		sendLogoutRequest();

		// Wait for a LogoutReply message
		gViewerWindow->setShowProgress(!gSavedSettings.getBOOL("MeerkatDisableLogoutScreens"));
		gViewerWindow->setProgressPercent(100.f);
		gViewerWindow->setProgressString("Logging out...");
		return;
	}

	// Make sure that we quit if we haven't received a reply from the server.
	if( logoutRequestSent() 
		&& gLogoutTimer.getElapsedTimeF32() > gLogoutMaxTime )
	{
		forceQuit();
		return;
	}
}

void LLAppViewer::sendLogoutRequest()
{
	if(!mLogoutRequestSent)
	{
		LLMessageSystem* msg = gMessageSystem;
		msg->newMessageFast(_PREHASH_LogoutRequest);
		msg->nextBlockFast(_PREHASH_AgentData);
		msg->addUUIDFast(_PREHASH_AgentID, gAgent.getID() );
		msg->addUUIDFast(_PREHASH_SessionID, gAgent.getSessionID());
		gAgent.sendReliableMessage();

		gLogoutTimer.reset();
		gLogoutMaxTime = LOGOUT_REQUEST_TIME;
		mLogoutRequestSent = TRUE;
		
		gVoiceClient->leaveChannel();

		//Set internal status variables and marker files
		gLogoutInProgress = TRUE;
		mLogoutMarkerFileName = gDirUtilp->getExpandedFilename(LL_PATH_LOGS,LOGOUT_MARKER_FILE_NAME);
		
		LLAPRFile outfile ;
		outfile.open(mLogoutMarkerFileName, LL_APR_W, LLAPRFile::global);
		mLogoutMarkerFile =  outfile.getFileHandle() ;
		if (mLogoutMarkerFile)
		{
			llinfos << "Created logout marker file " << mLogoutMarkerFileName << llendl;
    		apr_file_close(mLogoutMarkerFile);
		}
		else
		{
			llwarns << "Cannot create logout marker file " << mLogoutMarkerFileName << llendl;
		}		
	}
}

//
// Handle messages, and all message related stuff
//

#define TIME_THROTTLE_MESSAGES

#ifdef TIME_THROTTLE_MESSAGES
#define CHECK_MESSAGES_DEFAULT_MAX_TIME .020f // 50 ms = 50 fps (just for messages!)
static F32 CheckMessagesMaxTime = CHECK_MESSAGES_DEFAULT_MAX_TIME;
#endif

void LLAppViewer::idleNetwork()
{
	if (gDisconnected)
		return;

	pingMainloopTimeout("idleNetwork");

	gObjectList.mNumNewObjects = 0;
	S32 total_decoded = 0;

	if (!gSavedSettings.getBOOL("SpeedTest"))
	{
		LLFastTimer t(LLFastTimer::FTM_IDLE_NETWORK); // decode
		
		// deal with any queued name requests and replies.
		gCacheName->processPending();

		LLTimer check_message_timer;
		//  Read all available packets from network 
		stop_glerror();
		const S64 frame_count = gFrameCount;  // U32->S64
		F32 total_time = 0.0f;
   		while (gMessageSystem->checkAllMessages(frame_count, gServicePump)) 
		{
			if (gDoDisconnect)
			{
				// We're disconnecting, don't process any more messages from the server
				// We're usually disconnecting due to either network corruption or a
				// server going down, so this is OK.
				break;
			}
			stop_glerror();

			total_decoded++;
			gPacketsIn++;

			if (total_decoded > MESSAGE_MAX_PER_FRAME)
			{
				break;
			}

#ifdef TIME_THROTTLE_MESSAGES
			// Prevent slow packets from completely destroying the frame rate.
			// This usually happens due to clumps of avatars taking huge amount
			// of network processing time (which needs to be fixed, but this is
			// a good limit anyway).
			total_time = check_message_timer.getElapsedTimeF32();
			if (total_time >= CheckMessagesMaxTime)
				break;
#endif
		}
		// Handle per-frame message system processing.
		gMessageSystem->processAcks();

#ifdef TIME_THROTTLE_MESSAGES
		if (total_time >= CheckMessagesMaxTime)
		{
			// Increase CheckMessagesMaxTime so that we will eventually catch up
			CheckMessagesMaxTime *= 1.035f; // 3.5% ~= x2 in 20 frames, ~8x in 60 frames
		}
		else
		{
			// Reset CheckMessagesMaxTime to default value
			CheckMessagesMaxTime = CHECK_MESSAGES_DEFAULT_MAX_TIME;
		}
#endif
		


		// we want to clear the control after sending out all necessary agent updates
		gAgent.resetControlFlags();
		stop_glerror();

		
		// Decode enqueued messages...
		S32 remaining_possible_decodes = MESSAGE_MAX_PER_FRAME - total_decoded;

		if( remaining_possible_decodes <= 0 )
		{
			llinfos << "Maxed out number of messages per frame at " << MESSAGE_MAX_PER_FRAME << llendl;
		}

		if (gPrintMessagesThisFrame)
		{
			llinfos << "Decoded " << total_decoded << " msgs this frame!" << llendl;
			gPrintMessagesThisFrame = FALSE;
		}
	}

	gObjectList.mNumNewObjectsStat.addValue(gObjectList.mNumNewObjects);

	if (gDisconnected)
		return;

	// Retransmit unacknowledged packets.
	if (gXferManager)
		gXferManager->retransmitUnackedPackets();
	gAssetStorage->checkForTimeouts();

	gViewerThrottle.updateDynamicThrottle();


	// Check that the circuit between the viewer and the agent's current
	// region is still alive
	LLViewerRegion *agent_region = gAgent.getRegion();
	if ((agent_region)&&(LLStartUp::getStartupState() == STATE_STARTED))
	{
		LLUUID this_region_id = agent_region->getRegionID();
		bool this_region_alive = agent_region->isAlive();
		if ((mAgentRegionLastAlive && !this_region_alive) // newly dead
		    && (mAgentRegionLastID == this_region_id)) // same region
		{
			forceDisconnect(LLTrans::getString("AgentLostConnection"));
		}
		mAgentRegionLastID = this_region_id;
		mAgentRegionLastAlive = this_region_alive;
	}
}

void LLAppViewer::disconnectViewer()
{
	if (gDisconnected)
	{
		return;
	}
	
	//set this true now, to prevent things from trying to access the network we are destroying
	gDisconnected = TRUE;
	//
	// Cleanup after quitting.
	//	
	// Save snapshot for next time, if we made it through initialization

	llinfos << "Disconnecting viewer!" << llendl;

	// Dump our frame statistics
	gFrameStats.dump();

	// Remember if we were flying
	gSavedSettings.setBOOL("FlyingAtExit", gAgent.getFlying() );

	// Un-minimize all windows so they don't get saved minimized
	if (!gNoRender)
	{
		if (gFloaterView)
		{
			gFloaterView->restoreAll();
		}
	}

	if (LLSelectMgr::getInstance())
	{
		LLSelectMgr::getInstance()->deselectAll();
	}

	if (!gNoRender)
	{
		// save inventory if appropriate
		gInventory.cache(gAgent.getInventoryRootID(), gAgent.getID());
		if(gInventoryLibraryRoot.notNull() && gInventoryLibraryOwner.notNull())
		{
			gInventory.cache(gInventoryLibraryRoot, gInventoryLibraryOwner);
		}
	}

	saveNameCache();

	// close inventory interface, close all windows
	LLInventoryView::cleanup();

	// Also writes cached agent settings to gSavedSettings
	gAgent.cleanup();

	// This is where we used to call gObjectList.destroy() and then delete gWorldp.
	// Now we just ask the LLWorld singleton to cleanly shut down.
	LLWorld::getInstance()->destroyClass();

	if (mQuitRequested)
		cleanup_xfer_manager();
}

void LLAppViewer::forceErrorLLError()
{
   	llerrs << "This is an llerror" << llendl;
}

void LLAppViewer::forceErrorBreakpoint()
{
// [RLVa:KB] - Alternate: Snowglobe-1.0 | Checked: 2009-08-05 (RLVa-1.0.1e) | Modified: RLVa-1.0.1e
	// TODO-RLVa: find some way to initialize the lookup table when we need them *and* support toggling RLVa at runtime
	gRlvHandler.initLookupTables();

	if (rlv_handler_t::isEnabled())
	{
		RlvCurrentlyWorn::fetchWorn();
		rlv_handler_t::fetchSharedInventory();

		#ifdef RLV_EXTENSION_STARTLOCATION
			RlvSettings::updateLoginLastLocation();
		#endif // RLV_EXTENSION_STARTLOCATION

		gRlvHandler.processRetainedCommands();
	}
// [/RLVa:KB]

#ifdef LL_WINDOWS
    DebugBreak();
#endif
    return;
}

void LLAppViewer::forceErrorBadMemoryAccess()
{
    S32* crash = NULL;
    *crash = 0xDEADBEEF;
    return;
}

void LLAppViewer::forceErrorInifiniteLoop()
{
    while(true)
    {
        ;
    }
    return;
}
 
void LLAppViewer::forceErrorSoftwareException()
{
    // *FIX: Any way to insure it won't be handled?
    throw; 
}

void LLAppViewer::forceErrorDriverCrash()
{
	glDeleteTextures(1, NULL);
}

void LLAppViewer::initMainloopTimeout(const std::string& state, F32 secs)
{
	if(!mMainloopTimeout)
	{
		mMainloopTimeout = new LLWatchdogTimeout();
		resumeMainloopTimeout(state, secs);
	}
}

void LLAppViewer::destroyMainloopTimeout()
{
	if(mMainloopTimeout)
	{
		delete mMainloopTimeout;
		mMainloopTimeout = NULL;
	}
}

void LLAppViewer::resumeMainloopTimeout(const std::string& state, F32 secs)
{
	if(mMainloopTimeout)
	{
		if(secs < 0.0f)
		{
			secs = gSavedSettings.getF32("MainloopTimeoutDefault");
		}
		
		mMainloopTimeout->setTimeout(secs);
		mMainloopTimeout->start(state);
	}
}

void LLAppViewer::pauseMainloopTimeout()
{
	if(mMainloopTimeout)
	{
		mMainloopTimeout->stop();
	}
}

void LLAppViewer::pingMainloopTimeout(const std::string& state, F32 secs)
{
//	if(!restoreErrorTrap())
//	{
//		llwarns << "!!!!!!!!!!!!! Its an error trap!!!!" << state << llendl;
//	}
	
	if(mMainloopTimeout)
	{
		if(secs < 0.0f)
		{
			secs = gSavedSettings.getF32("MainloopTimeoutDefault");
		}

		mMainloopTimeout->setTimeout(secs);
		mMainloopTimeout->ping(state);
	}
}

