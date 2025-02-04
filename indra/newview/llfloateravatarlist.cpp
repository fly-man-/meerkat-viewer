/** 
 * @file llfloatermute.cpp
 * @brief Container for mute list
 *
 * @author Dale Glass <dale@daleglass.net>, (C) 2007
 */

/**
 * Rewritten by jcool410
 * Altered it to work in 1.22.8
 * Removed usage of globals
 * Removed TrustNET
 * Added utilization of "minimap" data
 */

#include "llviewerprecompiledheaders.h"

#include "llavatarconstants.h"
#include "llfloateravatarlist.h"

#include "lluictrlfactory.h"
#include "llviewerwindow.h"
#include "llscrolllistctrl.h"

#include "llvoavatar.h"
#include "llimview.h"
#include "llfloateravatarinfo.h"
#include "llregionflags.h"
#include "llfloaterreporter.h"
#include "llagent.h"
#include "llviewerregion.h"
#include "lltracker.h"
#include "llviewercontrol.h"
#include "llviewerstats.h"
#include "llerror.h"
#include "llchat.h"
#include "llviewermessage.h"
#include "llweb.h"
#include "llviewerobjectlist.h"
#include "llmutelist.h"
#include "llchat.h"
#include "llfloaterchat.h"
#include "llcallbacklist.h"

#include <time.h>
#include <string.h>

#include <map>


#include "llworld.h"

#include "llsdutil.h"

// Timeouts
/**
 * @brief How long to keep showing an activity, in seconds
 */
const F32 ACTIVITY_TIMEOUT = 1.0f;


/**
 * @brief How many seconds to wait between data requests
 *
 * This is intended to avoid flooding the server with requests
 */
const F32 MIN_REQUEST_INTERVAL   = 1.0f;

/**
 * @brief How long to wait for a request to arrive during the first try in seconds
 */
const F32 FIRST_REQUEST_TIMEOUT  = 16.0f;

/**
 * @brief Delay is doubled on each attempt. This is as high as it'll go
 */
const F32 MAX_REQUEST_TIMEOUT    = 2048.0f;
 
/**
 * How long to wait for a request to arrive before assuming failure
 * and showing the failure icon in the list. This is just for the user's
 * information, if a reply arrives after this interval we'll accept it anyway.
 */
const F32 REQUEST_FAIL_TIMEOUT   = 15.0f;

/**
 * How long to keep people who are gone in the list. After this time is reached,
 * they're not shown in the list anymore, but still kept in memory until
 * CLEANUP_TIMEOUT is reached.
 */
const F32 DEAD_KEEP_TIME = 10.0f;

/**
 * @brief How long to keep entries around before removing them.
 *
 * @note Longer term, data like birth and payment info should be cached on disk.
 */
const F32 CLEANUP_TIMEOUT = 3600.0f;


/**
 * @brief TrustNet channel
 * This is fixed in the adapter script.
 */
//const S32 TRUSTNET_CHANNEL = 0x44470002;


extern U32 gFrameCount;

/*
LLAvListTrustNetScore::LLAvListTrustNetScore(std::string type, F32 score)
{
	Score = score;
	Type = type;	
}*/


LLAvatarInfo::LLAvatarInfo()
{
}

LLAvatarInfo::LLAvatarInfo(PAYMENT_TYPE payment, ACCOUNT_TYPE account, struct tm birth)
{
	Payment = payment;
	Account = account;
	BirthDate = birth;
}

S32 LLAvatarInfo::getAge()
{
	time_t birth = mktime(&BirthDate);
	time_t now = time(NULL);
	return(S32)(difftime(now,birth) / (60*60*24));
}
typedef enum e_radar_alert_type
{
	ALERT_TYPE_SIM = 0,
	ALERT_TYPE_DRAW = 1,
	ALERT_TYPE_CHATRANGE = 2
} ERadarAlertType;
void chat_avatar_status(std::string name, LLUUID key, ERadarAlertType type, bool entering)
{
	if(gSavedSettings.getBOOL("MeerkatRadarChatAlerts"))
	{
		LLChat chat;
		switch(type)
		{
		case ALERT_TYPE_SIM:
			if(gSavedSettings.getBOOL("MeerkatRadarAlertSim"))
			{
				chat.mText = name+" has "+(entering ? "entered" : "left")+" the sim.";// ("+key.asString()+")";
			}
			break;
		case ALERT_TYPE_DRAW:
			if(gSavedSettings.getBOOL("MeerkatRadarAlertDraw"))
			{
				chat.mText = name+" has "+(entering ? "entered" : "left")+" draw distance.";// ("+key.asString()+")";
			}
			break;
		case ALERT_TYPE_CHATRANGE:
			if(gSavedSettings.getBOOL("MeerkatRadarAlertChatRange"))
			{
				chat.mText = name+" has "+(entering ? "entered" : "left")+" chat range.";// ("+key.asString()+")";
			}
			break;
		}
		if(chat.mText != "")
		{
			chat.mSourceType = CHAT_SOURCE_SYSTEM;
			LLFloaterChat::addChat(chat);
		}
	}
}

void LLAvatarListEntry::setPosition(LLVector3d position, bool this_sim, bool drawn, bool chatrange)
{
	if ( drawn )
	{
		if ( mDrawPosition != position && !mDrawPosition.isExactlyZero() )
		{
			setActivity(ACTIVITY_MOVING);
		}

		mDrawPosition = position;
	} else if( mInDrawFrame == U32_MAX ) {
		mDrawPosition.setZero();
	}

	mPosition = position;

	mFrame = gFrameCount;
	if(this_sim)
	{
		if(mInSimFrame == U32_MAX)
		{
			chat_avatar_status(mName,mID,ALERT_TYPE_SIM, true);
			if(gSavedSettings.getBOOL("MeerkatRadarChatKeys"))
			{
			 	LLMessageSystem* msg = gMessageSystem;
			 	msg->newMessage("ScriptDialogReply");
			 	msg->nextBlock("AgentData");
			 	msg->addUUID("AgentID", gAgent.getID());
			 	msg->addUUID("SessionID", gAgent.getSessionID());
			 	msg->nextBlock("Data");
			 	msg->addUUID("ObjectID", gAgent.getID());
				//msg->addS32("ChatChannel", gSavedSettings.getString("MeerkatRadarChatKeysChannel").asInteger());
			 	msg->addS32("ChatChannel", gSavedSettings.getS32("MeerkatRadarChatKeysChannel"));
			 	msg->addS32("ButtonIndex", 1);
			 	msg->addString("ButtonLabel",std::string("65337,19,") + mID.asString());
				gAgent.sendReliableMessage();
			}
		}
		mInSimFrame = mFrame;
	}
	if(drawn)
	{
		if(mInDrawFrame == U32_MAX)chat_avatar_status(mName,mID,ALERT_TYPE_DRAW, true);
		mInDrawFrame = mFrame;
	}
	if(chatrange)
	{
		if(mInChatFrame == U32_MAX)chat_avatar_status(mName,mID,ALERT_TYPE_CHATRANGE, true);
		mInChatFrame = mFrame;
	}

	mUpdateTimer.start();
}

LLVector3d LLAvatarListEntry::getPosition()
{
	return mPosition;
}

bool LLAvatarListEntry::getAlive()
{
	U32 current = gFrameCount;
	if(mInSimFrame != U32_MAX && (current - mInSimFrame) >= 2)
	{
		mInSimFrame = U32_MAX;
		chat_avatar_status(mName,mID,ALERT_TYPE_SIM, false);
	}
	if(mInDrawFrame != U32_MAX && (current - mInDrawFrame) >= 2)
	{
		mInDrawFrame = U32_MAX;
		chat_avatar_status(mName,mID,ALERT_TYPE_DRAW, false);
	}
	if(mInChatFrame != U32_MAX && (current - mInChatFrame) >= 2)
	{
		mInChatFrame = U32_MAX;
		chat_avatar_status(mName,mID,ALERT_TYPE_CHATRANGE, false);
	}
	return ((current - mFrame) <= 2);
}
//U32 LLAvatarListEntry::getOffSimFrames()
//{
//	return (gFrameCount - mInSimFrame);
//}
//U32 LLAvatarListEntry::getOffDrawFrames()
//{
//	return (gFrameCount - mInDrawFrame);
//}
//U32 LLAvatarListEntry::getOutsideChatRangeFrames();
//{
//	return (gFrameCount - mInChatFrame);
//}

F32 LLAvatarListEntry::getEntryAgeSeconds()
{
	return mUpdateTimer.getElapsedTimeF32();
}

void LLAvatarListEntry::setName(std::string name)
{
	if ( name.empty() || (name.compare(" ") == 0))
	{
		//llwarns << "Trying to set empty name" << llendl;
	}
	mName = name;
}

std::string LLAvatarListEntry::getName()
{
	return mName;
}

LLUUID LLAvatarListEntry::getID()
{
	return mID;
}

void LLAvatarListEntry::setID(LLUUID id)
{
	if ( id.isNull() )
	{
		llwarns << "Trying to set null id" << llendl;
	}
	mID = id;
}

BOOL LLAvatarListEntry::getIsLinden()
{
	// Are there any employees that are not a Linden?
	// I suppose this is a bit redundant.
	return ( mIsLinden || ( mAvatarInfo.getValue().Account == ACCOUNT_EMPLOYEE ) );
}

void LLAvatarListEntry::setAccountCustomTitle(std::string &title)
{
	mAccountTitle = title;
	mAvatarInfo.getValue().Account = ACCOUNT_CUSTOM;
}

std::string LLAvatarListEntry::getAccountCustomTitle()
{
	return mAccountTitle;
}



void LLAvatarListEntry::setActivity(ACTIVITY_TYPE activity)
{
	if ( activity >= mActivityType || mActivityTimer.getElapsedTimeF32() > ACTIVITY_TIMEOUT )
	{
		mActivityType = activity;
		mActivityTimer.start();
	}
}

ACTIVITY_TYPE LLAvatarListEntry::getActivity()
{
	if ( mActivityTimer.getElapsedTimeF32() > ACTIVITY_TIMEOUT )
	{
		mActivityType = ACTIVITY_NONE;
	}
	
	return mActivityType;
}

void LLAvatarListEntry::toggleMark()
{
	mMarked = !mMarked;
}

BOOL LLAvatarListEntry::isMarked()
{
	return mMarked;
}

BOOL LLAvatarListEntry::isDead()
{
	return getEntryAgeSeconds() > DEAD_KEEP_TIME;
}

LLFloaterAvatarList* LLFloaterAvatarList::sInstance = NULL;

LLFloaterAvatarList::LLFloaterAvatarList() :  LLFloater(std::string("avatar list"))
{
	llassert_always(sInstance == NULL);
	sInstance = this;
}

LLFloaterAvatarList::~LLFloaterAvatarList()
{
	gIdleCallbacks.deleteFunction( LLFloaterAvatarList::callbackIdle );
	sInstance = NULL;
}

//static
void LLFloaterAvatarList::toggle(void*)
{
	if (sInstance)
	{
		if(sInstance->getVisible())
		{
			sInstance->close(false);
		}
		else
		{
			sInstance->open();
		}
	}
	else
	{
		showInstance();
	}
}

//static
void LLFloaterAvatarList::showInstance()
{
	if (sInstance)
	{
		if(!sInstance->getVisible())
		{
			sInstance->open();
		}
	}
	else
	{
		sInstance = new LLFloaterAvatarList();
		LLUICtrlFactory::getInstance()->buildFloater(sInstance, "floater_avatar_scanner.xml");
	}
}

void LLFloaterAvatarList::draw()
{
	LLFloater::draw();
}

void LLFloaterAvatarList::onOpen()
{
	gSavedSettings.setBOOL("ShowAvatarList", TRUE);
	sInstance->setVisible(TRUE);
}

void LLFloaterAvatarList::onClose(bool app_quitting)
{
	sInstance->setVisible(FALSE);
	if( !app_quitting )
	{
		gSavedSettings.setBOOL("ShowAvatarList", FALSE);
	}
	if ( !gSavedSettings.getBOOL("MeerkatAvatarListKeepOpen") || app_quitting )
	{
		destroy();
	}
}

BOOL LLFloaterAvatarList::postBuild()
{
	{
		LLTabContainer* tab = getChild<LLTabContainer>("actions_tab_container");

		if(tab)
		{
			LLPanel* panel = tab->getPanelByName("custom_tab");

			if(panel)
			{
				tab->enableTabButton(tab->getIndexForPanel(panel), FALSE);
			}
		}
	}

	// Default values
	mTracking = FALSE;
	mTrackByLocation = FALSE;
	mARLastFrame = 0;

	// Create interface from XML
	//gUICtrlFactory->buildFloater(this, "floater_avatar_scanner.xml");

	// Floater starts hidden	
	//setVisible(FALSE);

	// Hide them until some other way is found
	// Users may not expect to find a Ban feature on the Eject button
	childSetVisible("refresh_btn", false);
	childSetVisible("ban_btn", false);
	childSetVisible("unban_btn", false);
	//childSetVisible("unmute_btn", false);
	childSetVisible("estate_ban_btn", false);

	// Set callbacks
	//childSetAction("refresh_btn", onClickRefresh, this);
	childSetAction("profile_btn", onClickProfile, this);
	childSetAction("im_btn", onClickIM, this);
	childSetAction("track_btn", onClickTrack, this);
	childSetAction("mark_btn", onClickMark, this);

	childSetAction("prev_in_list_btn", onClickPrevInList, this);
	childSetAction("next_in_list_btn", onClickNextInList, this);
	childSetAction("prev_marked_btn", onClickPrevMarked, this);
	childSetAction("next_marked_btn", onClickNextMarked, this);
	
	childSetAction("get_key_btn", onClickGetKey, this);

	childSetAction("freeze_btn", onClickFreeze, this);
	childSetAction("eject_btn", onClickEject, this);
//	childSetAction("ban_btn", onClickBan, this);
//	childSetAction("unban_btn", onClickUnban, this);
	childSetAction("mute_btn", onClickMute, this);
	childSetAction("unmute_btn", onClickUnmute, this);
	childSetAction("ar_btn", onClickAR, this);
	childSetAction("teleport_btn", onClickTeleport, this);
	childSetAction("estate_eject_btn", onClickEjectFromEstate, this);

	// *FIXME: Uncomment once onClickRefresh has been restored
	//setDefaultBtn("refresh_btn");

	// Get a pointer to the scroll list from the interface
	mAvatarList = getChild<LLScrollListCtrl>("avatar_list");

	mAvatarList->setCallbackUserData(this);
	mAvatarList->setDoubleClickCallback(onDoubleClick);
	mAvatarList->sortByColumn("distance", TRUE);
	mDataRequestTimer.start();
	refreshAvatarList();

	//LLMessageSystem *msg = gMessageSystem;
	//msg->addHandlerFunc("AvatarPropertiesReply", processAvatarPropertiesReply);

	gIdleCallbacks.addFunction( LLFloaterAvatarList::callbackIdle );

	return TRUE;
}

void LLFloaterAvatarList::updateAvatarList()
{
//	LLVOAvatar *avatarp;

	if( sInstance != this ) return;

	//llinfos << "avatar list refresh: updating map" << llendl;

	// Check whether updates are enabled
	LLCheckboxCtrl* check;
	check = getChild<LLCheckboxCtrl>("update_enabled_cb");

	if ( !check->getValue() )
	{
		return;
	}

	LLVector3d mypos = gAgent.getPositionGlobal();

	{//iterate minimap so if they are within draw the more precise value ends up used
		// Draw avatars
		//const LLVector3d& my_origin_global = gAgent.getRegion()->getOriginGlobal();
		LLVector3d pos_global;
		for (LLWorld::region_list_t::iterator iter = LLWorld::getInstance()->mActiveRegionList.begin();
			 iter != LLWorld::getInstance()->mActiveRegionList.end(); ++iter)
		{
			LLViewerRegion* regionp = *iter;
			const LLVector3d& origin_global = regionp->getOriginGlobal();

			S32 count = regionp->mMapAvatars.count();
			S32 i;
			LLVector3 pos_local;
			U32 compact_local;
			U8 bits;
			for (i = 0; i < count; i++)
			{
				compact_local = regionp->mMapAvatars.get(i);

				bits = compact_local & 0xFF;
				pos_local.mV[VZ] = F32(bits) * 4.f;
				compact_local >>= 8;

				bits = compact_local & 0xFF;
				pos_local.mV[VY] = (F32)bits;
				compact_local >>= 8;

				bits = compact_local & 0xFF;
				pos_local.mV[VX] = (F32)bits;

				pos_global.setVec( pos_local );
				pos_global += origin_global;

				if( i < regionp->mMapAvatarIDs.count())
				{
					std::string name;
					std::string first;
					std::string last;
					LLUUID avid = regionp->mMapAvatarIDs.get(i);
					gCacheName->getName(avid, first, last);
					name=  first+" "+last;
					LLVector3d position = pos_global;
					if (name.empty() || (name.compare(" ") == 0) || first == gCacheName->getDefaultName())
					{
						//llinfos << "Name empty for avatar " << avid << llendl;
						continue;
					}
					if( pos_global.mdV[VZ] == 0.0)
					{
						//bad hax :<
						//uhh... >.>  i am going to play with this at the display part... yeah
					}

					if (avid.isNull())
					{
						//llinfos << "Key empty for avatar " << name << llendl;
						continue;
					}

					if ( mAvatars.count( avid ) > 0 )
					{
						// Avatar already in list, update position
						mAvatars[avid].setPosition(position, (regionp == gAgent.getRegion()), false, (position - mypos).magVec() < 20.0);
					}
					else
					{
						// Avatar not there yet, add it
						BOOL isLinden = last == "Linden";

						LLAvatarListEntry entry(avid, name, position, isLinden);
						mAvatars[avid] = entry;

						//sendAvatarPropertiesRequest(avid);
						//llinfos << "avatar list refresh: adding " << name << llendl;

					}

					//if(mAreaAlertList.count( avid ) > 0 )
					//{
						
						//if(mAreaAlertList[avid].area < 1)
						//{
						//	mAreaAlertList[avid].area = 1;
					//		LLChat chat;
					//		chat.mSourceType = CHAT_SOURCE_SYSTEM;
					//		chat.mText = 
						//}
						//
					//}
					
				}
			}
		}
	}
	/*
	 * Iterate over all the avatars known at the time
	 * NOTE: Is this the right way to do that? It does appear that LLVOAvatar::isInstances contains
	 * the list of avatars known to the client. This seems to do the task of tracking avatars without
	 * any additional requests.
	 *
	 * BUG: It looks like avatars sometimes get stuck in this list, and keep perpetually
	 * moving in the same direction. My current guess is that somewhere else the client
	 * doesn't notice an avatar disappeared, and keeps updating its position. This should
	 * be solved at the source of the problem.
	 */
	for (std::vector<LLCharacter*>::iterator iter = LLCharacter::sInstances.begin();
		iter != LLCharacter::sInstances.end(); ++iter)
	{
		LLVOAvatar* avatarp = (LLVOAvatar*) *iter;

		// Skip if avatar is dead(what's that?)
		// or if the avatar is ourselves.
		if (avatarp->isDead() || avatarp->isSelf())
		{
			continue;
		}

		// Get avatar data
		LLVector3d position = gAgent.getPosGlobalFromAgent(avatarp->getCharacterPosition());
		LLUUID avid = avatarp->getID();
		std::string name = avatarp->getFullname();

		// Apparently, sometimes the name comes out empty, with a " " name. This is because
		// getFullname concatenates first and last name with a " " in the middle.
		// This code will avoid adding a nameless entry to the list until it acquires a name.

		//duped for lower section
		if (name.empty() || (name.compare(" ") == 0))// || (name.compare(gCacheName->getDefaultName()) == 0))
		{
			//llinfos << "Name empty for avatar " << avid << llendl;
			continue;
		}

		if (avid.isNull())
		{
			//llinfos << "Key empty for avatar " << name << llendl;
			continue;
		}

		if ( mAvatars.count( avid ) > 0 )
		{
			// Avatar already in list, update position
			mAvatars[avid].setPosition(position, (avatarp->getRegion() == gAgent.getRegion()), true, (position - mypos).magVec() < 20.0);
		}
		else
		{
			// Avatar not there yet, add it
			BOOL isLinden = ( strcmp(avatarp->getNVPair("LastName")->getString(),"Linden") == 0);

			LLAvatarListEntry entry(avid, name, position, isLinden);
			mAvatars[avid] = entry;

			//sendAvatarPropertiesRequest(avid);
			//llinfos << "avatar list refresh: adding " << name << llendl;

		}
	}

//	llinfos << "avatar list refresh: done" << llendl;

	expireAvatarList();
	refreshAvatarList();
	checkTrackingStatus();
	//processARQueue();
}

void LLFloaterAvatarList::expireAvatarList()
{
//	llinfos << "avatar list: expiring" << llendl;
	std::map<LLUUID, LLAvatarListEntry>::iterator iter;
	std::queue<LLUUID> delete_queue;

	for(iter = mAvatars.begin(); iter != mAvatars.end(); iter++)
	{
		LLAvatarListEntry *ent = &iter->second;
		
		if ( !ent->getAlive())
		{
			ent->setActivity(ACTIVITY_DEAD);
		}


		if ( ent->getEntryAgeSeconds() > CLEANUP_TIMEOUT )
		{
			//llinfos << "avatar list: expiring avatar " << ent->getName() << llendl;
			LLUUID av_id = ent->getID();
			delete_queue.push(av_id);
		}
	}

	while(!delete_queue.empty())
	{
		mAvatars.erase(delete_queue.front());
		delete_queue.pop();
	}
}

/**
 * Redraws the avatar list
 * Only does anything if the avatar list is visible.
 * @author Dale Glass
 */
void LLFloaterAvatarList::refreshAvatarList() 
{


	// Don't update list when interface is hidden
	if (!sInstance->getVisible())return;

	LLCheckboxCtrl* fetch_data;
	fetch_data = getChild<LLCheckboxCtrl>("fetch_avdata_enabled_cb");

	//BOOL db_enabled = gSavedSettings.getBOOL("DBEnabled");
	//std::string db_avatar = gSavedPerAccountSettings.getString("DBAvatarName");
	//if ( db_avatar.empty() )
	//{
	//	db_enabled = FALSE;
	//}



	// We rebuild the list fully each time it's refreshed
	// The assumption is that it's faster to refill it and sort than
	// to rebuild the whole list.
	LLDynamicArray<LLUUID> selected = mAvatarList->getSelectedIDs();
	S32 scrollpos = mAvatarList->getScrollPos();

	mAvatarList->deleteAllItems();

	LLVector3d mypos = gAgent.getPositionGlobal();


	std::map<LLUUID, LLAvatarListEntry>::iterator iter;
	for(iter = mAvatars.begin(); iter != mAvatars.end(); iter++)
	{
		LLSD element;
		LLUUID av_id;

		
		LLAvatarListEntry *ent = &iter->second;

		// Skip if avatar hasn't been around
		if ( ent->isDead() )
		{
			continue;
		}

		av_id = ent->getID();

		// Get avatar name, position
		LLAvatarInfo avinfo = ent->mAvatarInfo.getValue();
		//LLAvListTrustNetScore avscore = ent->mTrustNetScore.getValue();

		DATA_STATUS avinfo_status = ent->mAvatarInfo.getStatus();
		//DATA_STATUS avscore_status = ent->mTrustNetScore.getStatus();

		LLVector3d position = ent->getPosition();
		//lgg stuff.. ok.. uhmm..
		BOOL flagForFedUpDistance = false;

		
		LLVector3d delta = position - mypos;
		F32 distance = (F32)delta.magVec();
		if(position.mdV[VZ] == 0.0)
		{
			flagForFedUpDistance = true;
			distance = 9000;
		}
		delta.mdV[2] = 0.0f;
		F32 side_distance = (F32)delta.magVec();

		std::string icon = "";

		// HACK: Workaround for an apparent bug:
		// sometimes avatar entries get stuck, and are registered
		// by the client as perpetually moving in the same direction.
		// this makes sure they get removed from the visible list eventually

		//jcool410 -- this fucks up seeing dueds thru minimap data > 1024m away, so, lets just say > 2048m to the side is bad
		//aka 8 sims
		if ( side_distance > 2048.0f)
		{
			continue;
		}

		if ( av_id.isNull() )
		{
			//llwarns << "Avatar with null key somehow got into the list!" << llendl;
			continue;
		}





		element["id"] = av_id;

		element["columns"][LIST_AVATAR_ICON]["column"] = "avatar_icon";
		element["columns"][LIST_AVATAR_ICON]["type"] = "text";
		if ( ent->isMarked() )
		{
			element["columns"][LIST_AVATAR_ICON]["type"] = "icon";
			element["columns"][LIST_AVATAR_ICON]["value"] = /*gViewerArt.getString(*/"flag_blue.tga"/*)*/;
		}


		if ( ent->getIsLinden() )
		{
			element["columns"][LIST_AVATAR_NAME]["font-style"] = "BOLD";
		}

		if ( ent->isFocused() )
		{
			element["columns"][LIST_AVATAR_NAME]["color"] = LLColor4::cyan.getValue();
		}

		//element["columns"][LIST_AVATAR_NAME]["font-color"] = getAvatarColor(ent, distance).getValue();
		element["columns"][LIST_AVATAR_NAME]["column"] = "avatar_name";
		element["columns"][LIST_AVATAR_NAME]["type"] = "text";
		element["columns"][LIST_AVATAR_NAME]["value"] = ent->getName().c_str();

		char temp[32];
		snprintf(temp, sizeof(temp), "%.2f", distance);

		element["columns"][LIST_DISTANCE]["column"] = "distance";
		element["columns"][LIST_DISTANCE]["type"] = "text";
		
		element["columns"][LIST_DISTANCE]["value"] = temp;
		if(flagForFedUpDistance)
		{
			//lgg fix for out of draw distance
			//element["columns"][LIST_DISTANCE]["value"] = std::string("(> "+llformat("%d", gSavedSettings.getF32("RenderFarClip") )+")");
			element["columns"][LIST_DISTANCE]["value"] = llformat("> %d", (S32)gSavedSettings.getF32("RenderFarClip") );
		}
		element["columns"][LIST_DISTANCE]["color"] = getAvatarColor(ent, distance, CT_DISTANCE).getValue();

		
		if ( avinfo_status == DATA_RETRIEVED )
		{
			element["columns"][LIST_AGE]["column"] = "age";
			element["columns"][LIST_AGE]["type"] = "text";
			element["columns"][LIST_AGE]["value"] = avinfo.getAge();
			element["columns"][LIST_AGE]["color"] = getAvatarColor(ent, distance, CT_AGE).getValue();
		}

		//element["columns"][LIST_SCORE]["column"] = "score";
		//element["columns"][LIST_SCORE]["type"] = "text";

		//icon = "";
		//switch(avscore_status)
		//{
		//	case DATA_UNKNOWN:
		//		icon = /*gViewerArt.getString(*/"info_unknown.tga"/*)*/;
		//		break;
		//	case DATA_REQUESTING:
		//		icon = /*gViewerArt.getString(*/"info_fetching.tga"/*)*/;
		//		break;
		//	case DATA_ERROR:
		//		icon =  /*gViewerArt.getString(*/"info_error.tga"/*)*/;
		//	case DATA_RETRIEVED:
		//		//element["columns"][LIST_SCORE]["value"] = avscore.Score;
		//		element["columns"][LIST_SCORE]["color"] = getAvatarColor(ent, distance, CT_SCORE).getValue();
		//		break;
		//}
		
		//if (!icon.empty() )
		//{	
		//	element["columns"][LIST_SCORE].erase("color");
		//	element["columns"][LIST_SCORE]["type"] = "icon";
		//	element["columns"][LIST_SCORE]["value"] = icon;
		//}
	

		// Get an icon for the payment data
		// These should be replaced with something proper instead of reusing whatever
		// LL-provided images happened to fit
		icon = "";

		switch(avinfo_status)
		{
			case DATA_UNKNOWN:
				icon = /*gViewerArt.getString(*/"info_unknown.tga"/*)*/;
				break;
			case DATA_REQUESTING:
				icon = /*gViewerArt.getString(*/"info_fetching.tga"/*)*/;
				break;
			case DATA_ERROR:
				icon =  /*gViewerArt.getString(*/"info_error.tga"/*)*/;
				break;
			case DATA_RETRIEVED:
				switch(avinfo.Payment)
				{
					case PAYMENT_NONE:
						break;
					case PAYMENT_ON_FILE:
						icon =  /*gViewerArt.getString(*/"payment_info_filled.tga"/*)*/;
						break;
					case PAYMENT_USED:
						icon =  /*gViewerArt.getString(*/"payment_info_used.tga"/*)*/;
						break;
					case PAYMENT_LINDEN:
						// confusingly named icon, maybe use something else
						icon =  /*gViewerArt.getString(*/"icon_top_pick.tga"/*)*/;
						break;
				}
				break;
		}

		element["columns"][LIST_PAYMENT]["column"] = "payment_data";
		element["columns"][LIST_PAYMENT]["type"] = "text";

		// TODO: Add icon for "unknown" status
		//if ( PAYMENT_NONE != avinfo.Payment && DATA_UNKNOWN != avinfo_status )
		if ( !icon.empty() )
		{
			element["columns"][LIST_PAYMENT].erase("color");
			element["columns"][LIST_PAYMENT]["type"] = "icon";
			element["columns"][LIST_PAYMENT]["value"] =  icon;
			//llinfos << "Payment icon: " << payment_icon << llendl;
		}

		
		ACTIVITY_TYPE activity = ent->getActivity();
		icon = "";
		switch( activity )
		{
			case ACTIVITY_NONE:
				break;
			case ACTIVITY_MOVING:
				icon = /*gViewerArt.getString(*/"inv_item_animation.tga"/*)*/;
				break;
			case ACTIVITY_GESTURING:
				icon = /*gViewerArt.getString(*/"inv_item_gesture.tga"/*)*/;
				break;
			case ACTIVITY_SOUND:
				icon = /*gViewerArt.getString(*/"inv_item_sound.tga"/*)*/;
				break;
			case ACTIVITY_REZZING:
				icon = /*gViewerArt.getString(*/"ff_edit_theirs.tga"/*)*/;
				break;
			case ACTIVITY_PARTICLES:
				// TODO: Replace with something better
				icon = /*gViewerArt.getString(*/"account_id_blue.tga"/*)*/;
				break;
			case ACTIVITY_NEW:
				icon = /*gViewerArt.getString(*/"avatar_new.tga"/*)*/;
				break;
			case ACTIVITY_TYPING:
				icon = /*gViewerArt.getString(*/"avatar_typing.tga"/*)*/;
				break;
			case ACTIVITY_DEAD:
				// TODO: Replace, icon is quite inappropiate
				icon = /*gViewerArt.getString(*/"avatar_gone.tga"/*)*/;
				break;
		}

		element["columns"][LIST_ACTIVITY]["column"] = "activity";
		element["columns"][LIST_ACTIVITY]["type"] = "text";

		if (!icon.empty() )
		{	
			element["columns"][LIST_ACTIVITY]["type"] = "icon";
			element["columns"][LIST_ACTIVITY]["value"] = icon;
			//llinfos << "Activity icon: " << activity_icon << llendl;
		}

		//element["columns"][LIST_PAYMENT]["column"] = "payment_data";
		//element["columns"][LIST_PAYMENT]["type"] = "text";

		element["columns"][LIST_CLIENT]["column"] = "client";
		element["columns"][LIST_CLIENT]["type"] = "text";
		LLColor4 avatar_name_color = gColors.getColor( "AvatarNameColor" );
		std::string client;
		LLVOAvatar *av = (LLVOAvatar*)gObjectList.findObject(av_id);
		if(av)
		{
			LLVOAvatar::resolveClient(avatar_name_color, client, av);
			if(client == "")client = "?";
			element["columns"][LIST_CLIENT]["value"] = client.c_str();
			//element["columns"][LIST_CLIENT]["color"] = avatar_name_color.getValue();
		}else
		{
			element["columns"][LIST_CLIENT]["value"] = "Out Of Range";
		}
		element["columns"][LIST_CLIENT]["color"] = avatar_name_color.getValue();
		

		// Add to list
		mAvatarList->addElement(element, ADD_BOTTOM);

		// Request data only if fetching avatar data is enabled
		if ( fetch_data->getValue() && ent->mAvatarInfo.requestIfNeeded() )
		{
			sendAvatarPropertiesRequest(av_id);
			//llinfos << "Data for avatar " << ent->getName() << " didn't arrive yet, retrying" << llendl;
		}

/*		if ( ent->mTrustNetScore.requestIfNeeded() )
		{
			requestTrustNetScore(av_id, ent->getName(), "behavior");
			llinfos << "Requesting TrustNet score for " << ent->getName() << llendl;
		}*/
		
		/*if ( db_enabled && ent->mMiscInfo.requestIfNeeded() )
		{
			requestMiscInfo(av_id, ent->getName());
			llinfos << "Requesting misc info for " << ent->getName() << llendl;
		}*/
	}

	// finish
	mAvatarList->sortItems();
	mAvatarList->selectMultiple(selected);
	mAvatarList->setScrollPos(scrollpos);

//	llinfos << "avatar list refresh: done" << llendl;

}

// static
void LLFloaterAvatarList::onClickIM(void* userdata)
{
	//llinfos << "LLFloaterFriends::onClickIM()" << llendl;
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;

	LLDynamicArray<LLUUID> ids = avlist->mAvatarList->getSelectedIDs();
	if(ids.size() > 0)
	{
		if(ids.size() == 1)
		{
			// Single avatar
			LLUUID agent_id = ids[0];

			char buffer[MAX_STRING];
			snprintf(buffer, MAX_STRING, "%s", avlist->mAvatars[agent_id].getName().c_str());
			gIMMgr->setFloaterOpen(TRUE);
			gIMMgr->addSession(
				buffer,
				IM_NOTHING_SPECIAL,
				agent_id);
		}
		else
		{
			// Group IM
			LLUUID session_id;
			session_id.generate();
			gIMMgr->setFloaterOpen(TRUE);
			gIMMgr->addSession("Avatars Conference", IM_SESSION_CONFERENCE_START, ids[0], ids);
		}
	}
}

void LLFloaterAvatarList::onClickTrack(void *userdata)
{
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;
	
 	LLScrollListItem *item =   avlist->mAvatarList->getFirstSelected();
	if (!item) return;

	LLUUID agent_id = item->getUUID();

	if ( avlist->mTracking && avlist->mTrackedAvatar == agent_id ) {
		LLTracker::stopTracking(NULL);
		avlist->mTracking = FALSE;
	}
	else
	{
		avlist->mTracking = TRUE;
		avlist->mTrackByLocation = FALSE;
		avlist->mTrackedAvatar = agent_id;
		LLTracker::trackAvatar(agent_id, avlist->mAvatars[agent_id].getName());
	}
}

void LLFloaterAvatarList::sendAvatarPropertiesRequest(LLUUID avid)
{
	

	lldebugs << "LLPanelAvatar::sendAvatarPropertiesRequest()" << llendl; 
	LLMessageSystem *msg = gMessageSystem;

	msg->newMessageFast(_PREHASH_AvatarPropertiesRequest);
	msg->nextBlockFast( _PREHASH_AgentData);
	msg->addUUIDFast(   _PREHASH_AgentID, gAgent.getID() );
	msg->addUUIDFast(_PREHASH_SessionID, gAgent.getSessionID());
	msg->addUUIDFast(   _PREHASH_AvatarID, avid);
	gAgent.sendReliableMessage();

	mAvatars[avid].mAvatarInfo.requestStarted();
}

// static
void LLFloaterAvatarList::processAvatarPropertiesReply(LLMessageSystem *msg, void**)
{

	if(!sInstance)return;

	LLFloaterAvatarList* self = NULL;
	LLAvatarInfo avinfo;

	BOOL	identified = FALSE;
	BOOL	transacted = FALSE;

	LLUUID	agent_id;	// your id
	LLUUID	avatar_id;	// target of this panel
	U32	flags = 0x0;
	char	born_on[DB_BORN_BUF_SIZE];
	S32	charter_member_size = 0;

	msg->getUUIDFast(_PREHASH_AgentData, _PREHASH_AgentID, agent_id);
	msg->getUUIDFast(_PREHASH_AgentData, _PREHASH_AvatarID, avatar_id );

	
	self = sInstance;

	// Verify that the avatar is in the list, if not, ignore.
	if ( self->mAvatarList->getItemIndex(avatar_id) < 0 )
	{
		return;
	}

	LLAvatarListEntry *entry = &self->mAvatars[avatar_id];

	msg->getStringFast(_PREHASH_PropertiesData, _PREHASH_BornOn, DB_BORN_BUF_SIZE, born_on);
	msg->getU32Fast(_PREHASH_PropertiesData, _PREHASH_Flags, flags);

	identified = (flags & AVATAR_IDENTIFIED);
	transacted = (flags & AVATAR_TRANSACTED);

	// What's this?
	// Let's see if I understand correctly: CharterMember property is dual purpose:
	// it either contains a number indicating an account type (usual value), or 
	// it contains a string with a custom title. Probably that's where Philip Linden's
	// "El Presidente" title comes from. Heh.
	U8 caption_index = 0;
	std::string caption_text;
	charter_member_size = msg->getSize("PropertiesData", "CharterMember");

	if(1 == charter_member_size)
	{
		msg->getBinaryData("PropertiesData", "CharterMember", &caption_index, 1);
	}
	else if(1 < charter_member_size)
	{
		char caption[MAX_STRING];
		msg->getString("PropertiesData", "CharterMember", MAX_STRING, caption);

		caption_text = caption;
		entry->setAccountCustomTitle(caption_text);
	}
		

	if(caption_text.empty())
	{
		
		const enum ACCOUNT_TYPE ACCT_TYPE[] = {
			ACCOUNT_RESIDENT,
			ACCOUNT_TRIAL,
			ACCOUNT_CHARTER_MEMBER,
			ACCOUNT_EMPLOYEE
		};

		//enum ACCOUNT_TYPE acct =
		avinfo.Account =  ACCT_TYPE[llclamp(caption_index, (U8)0, (U8)(sizeof(ACCT_TYPE)/sizeof(ACCT_TYPE[0])-1))];
		//entry->setAccountType(acct);

		
		if ( avinfo.Account != ACCOUNT_EMPLOYEE )
		{
			if ( transacted )
			{
				avinfo.Payment = PAYMENT_USED;
			}
			else if ( identified )
			{
				avinfo.Payment = PAYMENT_ON_FILE;
			}
			else
			{
				avinfo.Payment = PAYMENT_NONE;
			}
		}
		else
		{
			avinfo.Payment = PAYMENT_LINDEN;
		}
	}
	
	// Structure must be zeroed to have sane results, as we
	// have an incomplete string for input
	memset(&avinfo.BirthDate, 0, sizeof(avinfo.BirthDate));

	int num_read = sscanf(born_on, "%d/%d/%d", &avinfo.BirthDate.tm_mon,
	                                           &avinfo.BirthDate.tm_mday,
	                                           &avinfo.BirthDate.tm_year);

	if ( num_read == 3 && avinfo.BirthDate.tm_mon <= 12 )
	{
		avinfo.BirthDate.tm_year -= 1900;
		avinfo.BirthDate.tm_mon--;
	}
	else
	{
		// Zero again to remove any partially read data
		memset(&avinfo.BirthDate, 0, sizeof(avinfo.BirthDate));
		llwarns << "Error parsing birth date: " << born_on << llendl;
	}

	entry->mAvatarInfo.setValue(avinfo);
}

void LLFloaterAvatarList::checkTrackingStatus()
{

	if ( mTracking && LLTracker::getTrackedPositionGlobal().isExactlyZero() )
	{
		// trying to track an avatar, but tracker stopped tracking		
		if ( mAvatars.count( mTrackedAvatar ) > 0 && !mTrackByLocation )
		{
			llinfos << "Switching to location-based tracking" << llendl;
			mTrackByLocation = TRUE;
		}
		else
		{
			// not found
			llinfos << "Stopping tracking avatar, server-side didn't work, and not in list anymore." << llendl;
			LLTracker::stopTracking(NULL);
			mTracking = FALSE;
		}
	}

	if ( mTracking && mTrackByLocation )
	{
		std::string name = mAvatars[mTrackedAvatar].getName();
		std::string tooltip = "Tracking last known position";
		name += " (near)";
		LLTracker::trackLocation(mAvatars[mTrackedAvatar].getPosition(), name, tooltip);
	}

	//llinfos << "Tracking position: " << LLTracker::getTrackedPositionGlobal() << llendl;
	
}


BOOL  LLFloaterAvatarList::avatarIsInList(LLUUID avatar)
{
	return ( mAvatars.count( avatar ) > 0 );
}

LLAvatarListEntry * LLFloaterAvatarList::getAvatarEntry(LLUUID avatar)
{
	if ( avatar.isNull() )
	{
		return NULL;
	}

	std::map<LLUUID, LLAvatarListEntry>::iterator iter;

	iter = mAvatars.find(avatar);
	if ( iter == mAvatars.end() )
	{
		return NULL;
	}

	return &iter->second;	
	
	//if ( mAvatars.count( avatar ) < 0 )
	//{
		//return NULL;
	//}

	//return &mAvatars[avatar];
}
/*
void LLFloaterAvatarList::speakText(S32 channel, EChatType type, std::string text)
{
	LLMessageSystem* msg = gMessageSystem;

	msg->newMessageFast(_PREHASH_ChatFromViewer);
	msg->nextBlockFast(_PREHASH_AgentData);
	msg->addUUIDFast(_PREHASH_AgentID, gAgent.getID());
	msg->addUUIDFast(_PREHASH_SessionID, gAgent.getSessionID());
	msg->nextBlockFast(_PREHASH_ChatData);
	msg->addStringFast(_PREHASH_Message, text);
	msg->addU8Fast(_PREHASH_Type, type);
	msg->addS32("Channel", channel);

	gAgent.sendReliableMessage();

	gViewerStats->incStat(LLViewerStats::ST_CHAT_COUNT);
}
*/
/*
void LLFloaterAvatarList::requestTrustNetScore(LLUUID avatar, const std::string name, const std::string type)
{
	char *temp = new char[UUID_STR_LENGTH];
	avatar.toString(temp);

	std::string text = "GetScore|" + name + "|" + temp + "|" + type;
	speakText(TRUSTNET_CHANNEL, CHAT_TYPE_WHISPER, text);
}
*/
//static
/*
void LLFloaterAvatarList::replaceVars(std::string &str, LLUUID avatar, const std::string& name)
{
	char *temp = new char[UUID_STR_LENGTH];
	avatar.toString(temp);

	std::string vars[][2] = {
		{"$NAME", name},
		{"$KEY",  temp},
	};

	BOOL replaced = TRUE;

	while( replaced )
	{
		replaced = FALSE;
		for(U32 i=0;i<sizeof(vars)/sizeof(vars[0]);i++)
		{
			U32 pos = str.find(vars[i][0]);
			if ( pos != std::string::npos )
			{
				str.replace(pos, vars[i][0].size(), vars[i][1]);
				replaced = TRUE;
			}
		}
	}

}

void LLFloaterAvatarList::requestMiscInfo(LLUUID avatar, const std::string name)
{
	LLUUID   db_av_key;

	std::string message      = gSavedPerAccountSettings.getString("DBSendPattern");
	std::string db_av_name   = gSavedPerAccountSettings.getString("DBAvatarName");
	db_av_key.set(gSavedPerAccountSettings.getString("DBAvatarKey"));

	
	llinfos << "Requesting info " << llendl;
	replaceVars(message, avatar, name);

	llinfos << "Request string: " << message << llendl;
	send_simple_im(db_av_key, message.c_str());
 }

//static
BOOL LLFloaterAvatarList::handleIM(LLUUID from_id, const std::string message)
{
	LLUUID   db_av_key;
	db_av_key.set(gSavedPerAccountSettings.getString("DBAvatarKey"));

	if ( db_av_key == from_id )
	{
		std::map<LLUUID, LLAvatarListEntry>::iterator iter;

		for(iter = sInstance->mAvatars.begin(); iter != sInstance->mAvatars.end(); iter++)
		{
			LLAvatarListEntry *ent = &iter->second;
		
			// Check if the key, or the name are found in the reply.
			// Name is only accepted if it's in the beginning of the message.
			if ( message.find(ent->getID().asString()) != std::string::npos
			     || message.find(ent->getName().c_str()) == 0 )
			{
				LLMiscDBInfo info;
				info.data = message;

				llinfos << "Database reply arrived for avatar " << ent->getName() << llendl;
				ent->mMiscInfo.setValue(info);
			}
		}

		return TRUE;
	}
	return FALSE;
}
*/
//static
/*void LLFloaterAvatarList::processTrustNetReply(char *reply)
{
	char *tokens[10];
	char *tmp = &reply[0];
	U32 count = 0;

	llinfos << "TrustNet reply: " << reply << llendl;
	

	// Split into tokens
	while( (NULL != (tmp = strtok(tmp, "|"))) && count < (sizeof(tokens)/sizeof(tokens[0])) )
	{
		tokens[count++] = tmp;
		llinfos << "token: " << tmp << llendl;
		tmp = NULL;
	}

	llinfos << "Got " << count << " tokens" << llendl;

	if ( count >= 1 )
	{
		if (!strcmp(tokens[0], "Score") && count >= 4)
		{
			//format: key|type|score
			LLUUID avatar(tokens[1]);
			std::string type = tokens[2];
			F32 score = (F32)strtod(tokens[3], NULL);
			
			LLAvatarListEntry *ent = gFloaterAvatarList->getAvatarEntry(avatar);
			if ( ent != NULL )
			{
				LLAvListTrustNetScore s(type, score);
				ent->mTrustNetScore.setValue(s);
				llinfos << "Score arrived for avatar " << avatar << ": " << score << llendl;
			}
			else
			{
				llinfos << "Score arrived for avatar " << avatar << ", but it wasn't in the list anymore" << llendl;
			}
		}
		else if (!strcmp(tokens[0], "WebAuthToken") && count >= 2)
		{
			std::string URL = LLWeb::escapeURL(llformat("http://trustnet.daleglass.net/?session=%s", tokens[1]));
 			LLWeb::loadURL(URL);
		}
		else if (!strcmp(tokens[0], "WebPassword") && count >= 2)
		{
			std::string password = tokens[1];
			gViewerWindow->mWindow->copyTextToClipboard(utf8str_to_wstring(password));
		}
		else
		{
			llwarns << "Unrecognized TrustNet reply " << tokens[0] << llendl;
		}
	}
}*/

void LLFloaterAvatarList::luskwoodCommand(std::string cmd)
{
	LLDynamicArray<LLUUID> ids = mAvatarList->getSelectedIDs();

	for(LLDynamicArray<LLUUID>::iterator itr = ids.begin(); itr != ids.end(); ++itr)
	{
		LLUUID avid = *itr;
		LLAvatarListEntry *ent = getAvatarEntry(avid);
		if ( ent != NULL )
		{
			//llinfos << "Would say: " << cmd << " " << ent->getName() << llendl;
			// Use key got gokey, name for everything else
			//speakText(0, CHAT_TYPE_SHOUT, cmd + " " + ( cmd == "gokey" ? ent->getID().asString() :  ent->getName() ) );
		}
	}
}

//static
void LLFloaterAvatarList::onClickMark(void *userdata)
{
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;
	LLDynamicArray<LLUUID> ids = avlist->mAvatarList->getSelectedIDs();

	for(LLDynamicArray<LLUUID>::iterator itr = ids.begin(); itr != ids.end(); ++itr)
	{
		LLUUID avid = *itr;
		LLAvatarListEntry *ent = avlist->getAvatarEntry(avid);
		if ( ent != NULL )
		{
			ent->toggleMark();
		}
	}
}

void LLFloaterAvatarList::handleLuskwoodDialog(S32 option, void* data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;
	if ( 0 == option )
	{
		self->luskwoodCommand(self->mLuskwoodCommand);
	}
}

void LLFloaterAvatarList::handleLuskwoodGohomerOffDialog(S32 option, void* data)
{
	//LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;
	if ( 0 == option )
	{
		//self->speakText(0, CHAT_TYPE_SHOUT, "gohome off");
	}
}

//static
void LLFloaterAvatarList::onClickGohomerWarn(void *data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;

	self->mLuskwoodCommand = "gowarn";
	gViewerWindow->alertXml("LuskwoodGohomerWarn", handleLuskwoodDialog, self);

}

//static
void LLFloaterAvatarList::onClickGohomerEject(void *data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;

	self->mLuskwoodCommand = "goeject";
	gViewerWindow->alertXml("LuskwoodGohomerEject", handleLuskwoodDialog, self);
}

//static
void LLFloaterAvatarList::onClickGohomerSendAway(void *data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;

	self->mLuskwoodCommand = "goaway";
	gViewerWindow->alertXml("LuskwoodGohomerKeepAway", handleLuskwoodDialog, self);
}

//static
void LLFloaterAvatarList::onClickGohomerSendHome(void *data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;

	self->mLuskwoodCommand = "gohome";
	gViewerWindow->alertXml("LuskwoodGohomerSendHome", handleLuskwoodDialog, self);
}

//static
void LLFloaterAvatarList::onClickGohomerSendHomeByKey(void *data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;

	self->mLuskwoodCommand = "gokey";
	gViewerWindow->alertXml("LuskwoodGohomerSendHome", handleLuskwoodDialog, self);
}


//static
void LLFloaterAvatarList::onClickGohomerOff(void *data)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)data;

	gViewerWindow->alertXml("LuskwoodGohomerOff", handleLuskwoodGohomerOffDialog, self);
}

LLColor4 LLFloaterAvatarList::getAvatarColor(LLAvatarListEntry *ent, F32 distance, e_coloring_type type)
{
 	F32 r = 0.0f, g = 0.0f, b = 0.0f, a = 1.0f;

	switch(type)
	{
		case CT_NONE:
			return LLColor4::black;
			break;
		case CT_DISTANCE:
			if ( distance <= 10.0f )
			{
				// whisper range
				g = 0.7f - ( distance / 20.0f );
			}
			else if ( distance > 10.0f && distance <= 20.0f )
			{
				// talk range
				g = 0.7f - ( (distance - 10.0f) / 20.0f );
				b = g;
			}
			else if ( distance > 20.0f && distance <= 96.0f )
			{
				// shout range
				r = 0.7f - ( (distance - 20.0f) / 192.0f );
				b = r;
			}
			else
			{
				// unreachable by chat
				r = 1.0;
			}
			break;
		case CT_AGE:
			if ( ent->mAvatarInfo.getStatus() == DATA_RETRIEVED )
			{
				S32 age = ent->mAvatarInfo.getValue().getAge();
				if ( age < 14 )
				{
					r = 0.7f - ( age / 28 );
				}
				else if ( age > 14 && age <= 30 )
				{
					r = 0.7f - ( (age-14) / 32 );
					g = r;
				}
				else if ( age > 30 && age < 90 )
				{
					g = 0.7f - ( (age-30) / 120 );
				}
				else
				{
					b = 1.0f;
				}
			}
			break;
		case CT_SCORE:
/*			if ( ent->mTrustNetScore.getStatus() == DATA_RETRIEVED )
			{
				F32 score = ent->mTrustNetScore.getValue().Score;

				if ( score == 0.0 )
				{
					b = 1.0f;
				}
				else if ( score == 10.0f )
				{
					g = 1.0f;
				}
				else if ( score == -10.0f )
				{
					r = 1.0f;
				}
				else if ( score > 0.0f )
				{
					g = 0.2f + ( score / 20.0f );
				}
				else if ( score < 0.0f )
				{ 
					r = 0.2f + ( score / 20.0f );
				}
			}*/
			break;
		case CT_PAYMENT:
			break;
	}

	return LLColor4(r,g,b,a);
}

void LLFloaterAvatarList::onDoubleClick(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
 	LLScrollListItem *item =   self->mAvatarList->getFirstSelected();
	LLUUID agent_id = item->getUUID();

	gAgent.lookAtObject(agent_id, CAMERA_POSITION_OBJECT);
}

void LLFloaterAvatarList::removeFocusFromAll()
{
	std::map<LLUUID, LLAvatarListEntry>::iterator iter;

	for(iter = mAvatars.begin(); iter != mAvatars.end(); iter++)
	{
		LLAvatarListEntry *ent = &iter->second;
		ent->setFocus(FALSE);
	}
}

void LLFloaterAvatarList::focusOnPrev(BOOL marked_only)
{
	std::map<LLUUID, LLAvatarListEntry>::iterator iter;
	LLAvatarListEntry *prev = NULL;
	LLAvatarListEntry *ent;

	if ( mAvatars.size() == 0 )
	{
		return;
	}

	for(iter = mAvatars.begin(); iter != mAvatars.end(); iter++)
	{
		ent = &iter->second;

		if ( ent->isDead() )
			continue;

		if ( (ent->getID() == mFocusedAvatar) && (prev != NULL)  )
		{
			removeFocusFromAll();
			prev->setFocus(TRUE);
			mFocusedAvatar = prev->getID();
			gAgent.lookAtObject(mFocusedAvatar, CAMERA_POSITION_OBJECT);
			return;
		}

		if ( (!marked_only) || ent->isMarked() )
		{
			prev = ent;
		}
	}

	if (prev != NULL && ((!marked_only) || prev->isMarked()) )
	{
		removeFocusFromAll();
		prev->setFocus(TRUE);
		mFocusedAvatar = prev->getID();
		gAgent.lookAtObject(mFocusedAvatar, CAMERA_POSITION_OBJECT);
	}
}

void LLFloaterAvatarList::focusOnNext(BOOL marked_only)
{

	
	std::map<LLUUID, LLAvatarListEntry>::iterator iter;
	BOOL found = FALSE;
	LLAvatarListEntry *first = NULL;
	LLAvatarListEntry *ent;

	if ( mAvatars.size() == 0 )
	{
		return;
	}

	for(iter = mAvatars.begin(); iter != mAvatars.end(); iter++)
	{
		ent = &iter->second;

		if ( ent->isDead() )
			continue;

		if ( NULL == first && ((!marked_only) || ent->isMarked()))
		{
			first = ent;
		}

		if ( found && ((!marked_only) || ent->isMarked()) )
		{
			removeFocusFromAll();
			ent->setFocus(TRUE);
			mFocusedAvatar = ent->getID();
			gAgent.lookAtObject(mFocusedAvatar, CAMERA_POSITION_OBJECT);
			return;
		}

		if ( ent->getID() == mFocusedAvatar )
		{
			found = TRUE;
		} 
	}

	if (first != NULL && ((!marked_only) || first->isMarked()))
	{
		removeFocusFromAll();
		first->setFocus(TRUE);
		mFocusedAvatar = first->getID();
		gAgent.lookAtObject(mFocusedAvatar, CAMERA_POSITION_OBJECT);
	}
}
//static
void LLFloaterAvatarList::onClickPrevInList(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	self->focusOnPrev(FALSE);
}

//static
void LLFloaterAvatarList::onClickNextInList(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	self->focusOnNext(FALSE);
}

//static
void LLFloaterAvatarList::onClickPrevMarked(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	self->focusOnPrev(TRUE);
}

//static
void LLFloaterAvatarList::onClickNextMarked(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	self->focusOnNext(TRUE);
}

//static
/*void LLFloaterAvatarList::onClickTrustNetRate(void *userdata)
{
	// LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	llinfos << "Ratings not implemented yet" << llendl;
}*/
/*
//static
void LLFloaterAvatarList::onClickTrustNetExplain(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	LLScrollListItem *item =   self->mAvatarList->getFirstSelected();

	if ( item != NULL )
	{
		LLAvatarListEntry *ent = self->getAvatarEntry(item->getUUID());
		self->speakText(TRUSTNET_CHANNEL, CHAT_TYPE_WHISPER, "Explain|" + ent->getName() + "|" + ent->getID().asString());
	}
}

//static
void LLFloaterAvatarList::onClickTrustNetWebsite(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;

	self->speakText(TRUSTNET_CHANNEL, CHAT_TYPE_WHISPER, "GetWebAuthToken");
}

//static
void LLFloaterAvatarList::onClickTrustNetGetPassword(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;

	self->speakText(TRUSTNET_CHANNEL, CHAT_TYPE_WHISPER, "GetWebPassword");
}

//static
void LLFloaterAvatarList::onClickTrustNetRenew(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
	self->speakText(TRUSTNET_CHANNEL, CHAT_TYPE_WHISPER, "RenewSubscription");
}
*/
//static
void LLFloaterAvatarList::onClickGetKey(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;
 	LLScrollListItem *item = self->mAvatarList->getFirstSelected();

	if ( NULL == item ) return;

	LLUUID agent_id = item->getUUID();

	char buffer[UUID_STR_LENGTH];		/*Flawfinder: ignore*/
	agent_id.toString(buffer);

	gViewerWindow->mWindow->copyTextToClipboard(utf8str_to_wstring(buffer));
}


static void send_freeze(const LLUUID& avatar_id, bool freeze)
{
	U32 flags = 0x0;
	if (!freeze)
	{
		// unfreeze
		flags |= 0x1;
	}

	LLMessageSystem* msg = gMessageSystem;
	LLViewerObject* avatar = gObjectList.findObject(avatar_id);

	if (avatar)
	{
		msg->newMessage("FreezeUser");
		msg->nextBlock("AgentData");
		msg->addUUID("AgentID", gAgent.getID());
		msg->addUUID("SessionID", gAgent.getSessionID());
		msg->nextBlock("Data");
		msg->addUUID("TargetID", avatar_id );
		msg->addU32("Flags", flags );
		msg->sendReliable( avatar->getRegion()->getHost() );
	}
}

static void send_eject(const LLUUID& avatar_id, bool ban)
{	
	LLMessageSystem* msg = gMessageSystem;
	LLViewerObject* avatar = gObjectList.findObject(avatar_id);

	if (avatar)
	{
		U32 flags = 0x0;
		if ( ban )
		{
			// eject and add to ban list
			flags |= 0x1;
		}

		msg->newMessage("EjectUser");
		msg->nextBlock("AgentData");
		msg->addUUID("AgentID", gAgent.getID() );
		msg->addUUID("SessionID", gAgent.getSessionID() );
		msg->nextBlock("Data");
		msg->addUUID("TargetID", avatar_id );
		msg->addU32("Flags", flags );
		msg->sendReliable( avatar->getRegion()->getHost() );
	}
}

static void send_estate_message(
	const char* request,
	const LLUUID &target)
{

	LLMessageSystem* msg = gMessageSystem;
	LLUUID invoice;

	// This seems to provide an ID so that the sim can say which request it's
	// replying to. I think this can be ignored for now.
	invoice.generate();

	llinfos << "Sending estate request '" << request << "'" << llendl;
	msg->newMessage("EstateOwnerMessage");
	msg->nextBlockFast(_PREHASH_AgentData);
	msg->addUUIDFast(_PREHASH_AgentID, gAgent.getID());
	msg->addUUIDFast(_PREHASH_SessionID, gAgent.getSessionID());
	msg->addUUIDFast(_PREHASH_TransactionID, LLUUID::null); //not used
	msg->nextBlock("MethodData");
	msg->addString("Method", request);
	msg->addUUID("Invoice", invoice);

	// Agent id
	msg->nextBlock("ParamList");
	msg->addString("Parameter", gAgent.getID().asString().c_str());

	// Target
	msg->nextBlock("ParamList");
	msg->addString("Parameter", target.asString().c_str());

	msg->sendReliable(gAgent.getRegion()->getHost());
}

static void send_estate_ban(const LLUUID& agent)
{
	LLUUID invoice;
	U32 flags = ESTATE_ACCESS_BANNED_AGENT_ADD;

	invoice.generate();

	LLMessageSystem* msg = gMessageSystem;
	msg->newMessage("EstateOwnerMessage");
	msg->nextBlockFast(_PREHASH_AgentData);
	msg->addUUIDFast(_PREHASH_AgentID, gAgent.getID());
	msg->addUUIDFast(_PREHASH_SessionID, gAgent.getSessionID());
	msg->addUUIDFast(_PREHASH_TransactionID, LLUUID::null); //not used

	msg->nextBlock("MethodData");
	msg->addString("Method", "estateaccessdelta");
	msg->addUUID("Invoice", invoice);

	char buf[MAX_STRING];		/* Flawfinder: ignore*/
	gAgent.getID().toString(buf);
	msg->nextBlock("ParamList");
	msg->addString("Parameter", buf);

	snprintf(buf, MAX_STRING, "%u", flags);			/* Flawfinder: ignore */
	msg->nextBlock("ParamList");
	msg->addString("Parameter", buf);

	agent.toString(buf);
	msg->nextBlock("ParamList");
	msg->addString("Parameter", buf);

	gAgent.sendReliableMessage();
}

static void cmd_freeze(const LLUUID& avatar, const std::string &name)      { send_freeze(avatar, true); }
static void cmd_unfreeze(const LLUUID& avatar, const std::string &name)    { send_freeze(avatar, false); }
static void cmd_eject(const LLUUID& avatar, const std::string &name)       { send_eject(avatar, false); }
static void cmd_ban(const LLUUID& avatar, const std::string &name)         { send_eject(avatar, true); }
static void cmd_profile(const LLUUID& avatar, const std::string &name)     { LLFloaterAvatarInfo::showFromDirectory(avatar); }
//static void cmd_mute(const LLUUID&avatar, const std::string &name)         { LLMuteList::getInstance()->add(LLMute(avatar, name, LLMute::AGENT)); }
//static void cmd_unmute(const LLUUID&avatar, const std::string &name)       { LLMuteList::getInstance()->remove(LLMute(avatar, name, LLMute::AGENT)); }
static void cmd_estate_eject(const LLUUID &avatar, const std::string &name){ send_estate_message("teleporthomeuser", avatar); }
static void cmd_estate_ban(const LLUUID &avatar, const std::string &name)
{
	send_estate_message("teleporthomeuser", avatar); // Kick first, just to be sure
	send_estate_ban(avatar);
}

void LLFloaterAvatarList::doCommand(void (*func)(const LLUUID &avatar, const std::string &name))
{
	LLDynamicArray<LLUUID> ids = mAvatarList->getSelectedIDs();

	for(LLDynamicArray<LLUUID>::iterator itr = ids.begin(); itr != ids.end(); ++itr)
	{
		LLUUID avid = *itr;
		LLAvatarListEntry *ent = getAvatarEntry(avid);
		if ( ent != NULL )
		{
			llinfos << "Executing command on " << ent->getName() << llendl;
			func(avid, ent->getName());
		}
	}
}

std::string LLFloaterAvatarList::getSelectedNames(const std::string& separator)
{
	std::string ret = "";
	
	LLDynamicArray<LLUUID> ids = mAvatarList->getSelectedIDs();
	for(LLDynamicArray<LLUUID>::iterator itr = ids.begin(); itr != ids.end(); ++itr)
	{
		LLUUID avid = *itr;
		LLAvatarListEntry *ent = getAvatarEntry(avid);
		if ( ent != NULL )
		{
			if (!ret.empty()) ret += separator;
			ret += ent->getName();
		}
	}

	return ret;
}

//static 
void LLFloaterAvatarList::callbackFreeze(S32 option, void *userdata) { 
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;

	if ( option == 0 )
	{
		avlist->doCommand(cmd_freeze);
	}
	else if ( option == 1 )
	{
		avlist->doCommand(cmd_unfreeze);
	}
}

//static 
void LLFloaterAvatarList::callbackEject(S32 option, void *userdata) {
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;
 
	if ( option == 0 )
	{
		avlist->doCommand(cmd_eject);
	}
	else if ( option == 1 )
	{
		avlist->doCommand(cmd_ban);
	}
}

/*
//static 
void LLFloaterAvatarList::callbackMute(S32 option, void *userdata) {
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;

	if ( option == 0 )
	{
		avlist->doCommand(cmd_mute);
	} 
	else if ( option == 1 )
	{
		avlist->doCommand(cmd_unmute);
	}
}*/

//static 
void LLFloaterAvatarList::callbackEjectFromEstate(S32 option, void *userdata) {
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;

	if ( option == 0 )
	{
		avlist->doCommand(cmd_estate_eject);
	} 
	else if ( option == 1 )
	{
		avlist->doCommand(cmd_estate_ban);
	}
}

//static
void LLFloaterAvatarList::callbackIdle(void *userdata) {
	if ( LLFloaterAvatarList::sInstance != NULL ) {
		LLFloaterAvatarList::sInstance->updateAvatarList();
	}
}

void LLFloaterAvatarList::onClickFreeze(void *userdata)
{
	LLStringUtilBase<char>::format_map_t args;
	args["[NAMES]"] = ((LLFloaterAvatarList*)userdata)->getSelectedNames();
	gViewerWindow->alertXml("FreezeAvatar", args, callbackFreeze, userdata);
}

//static
void LLFloaterAvatarList::onClickEject(void *userdata)
{
	LLStringUtilBase<char>::format_map_t args;
	args["[NAMES]"] = ((LLFloaterAvatarList*)userdata)->getSelectedNames();
	gViewerWindow->alertXml("EjectAvatar", args, callbackEject, userdata);
}

//static
void LLFloaterAvatarList::onClickMute(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;

	//LLFloaterMute::showInstance();

	LLDynamicArray<LLUUID> ids = self->mAvatarList->getSelectedIDs();
	if(ids.size() > 0)
	{
		for(LLDynamicArray<LLUUID>::iterator itr = ids.begin(); itr != ids.end(); ++itr)
		{
			LLUUID agent_id = *itr;
		
			std::string agent_name;
			if(gCacheName->getFullName(agent_id, agent_name))
			{
				// *NOTE: Users may click on Mute multiple times to ensure a person is muted
				// there is no visual feedback given in Avatar List as of now
				if (LLMuteList::getInstance()->isMuted(agent_id))
				{
					//LLMute mute(agent_id, agent_name, LLMute::AGENT);
					//LLMuteList::getInstance()->remove(mute);	
					//LLFloaterMute::getInstance()->selectMute(agent_id);
				}
				else
				{
					LLMute mute(agent_id, agent_name, LLMute::AGENT);
					LLMuteList::getInstance()->add(mute);
				}
			}
		}
	}
}

//static
void LLFloaterAvatarList::onClickUnmute(void *userdata)
{
	LLFloaterAvatarList *self = (LLFloaterAvatarList*)userdata;

	//LLFloaterMute::showInstance();

	LLDynamicArray<LLUUID> ids = self->mAvatarList->getSelectedIDs();
	if(ids.size() > 0)
	{
		for(LLDynamicArray<LLUUID>::iterator itr = ids.begin(); itr != ids.end(); ++itr)
		{
			LLUUID agent_id = *itr;
		
			std::string agent_name;
			if(gCacheName->getFullName(agent_id, agent_name))
			{
				if (LLMuteList::getInstance()->isMuted(agent_id))
				{
					LLMute mute(agent_id, agent_name, LLMute::AGENT);
					LLMuteList::getInstance()->remove(mute);	
					//LLFloaterMute::getInstance()->selectMute(agent_id);
				}
				else
				{
					//LLMute mute(agent_id, agent_name, LLMute::AGENT);
					//LLMuteList::getInstance()->add(mute);
				}
			}
		}
	}
}

//static
void LLFloaterAvatarList::onClickEjectFromEstate(void *userdata)
{
	LLStringUtilBase<char>::format_map_t args;
	args["[NAMES]"] = ((LLFloaterAvatarList*)userdata)->getSelectedNames();
	gViewerWindow->alertXml("EjectAvatarEstate", args, callbackEjectFromEstate, userdata);
}



//static
void LLFloaterAvatarList::onClickAR(void *userdata)
{
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;
 	LLScrollListItem *item =   avlist->mAvatarList->getFirstSelected();

	if ( item )
	{
		LLUUID agent_id = item->getUUID();
		LLAvatarListEntry *ent = avlist->getAvatarEntry(agent_id);
		
		if ( ent )
		{
			LLFloaterReporter::showFromObject(ent->getID());
		}
	}
}

// static
void LLFloaterAvatarList::onClickProfile(void* userdata)
{
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;
	avlist->doCommand(cmd_profile);
}

//static
void LLFloaterAvatarList::onClickTeleport(void* userdata)
{
	LLFloaterAvatarList *avlist = (LLFloaterAvatarList*)userdata;
 	LLScrollListItem *item =   avlist->mAvatarList->getFirstSelected();

	if ( item )
	{
		LLUUID agent_id = item->getUUID();
		LLAvatarListEntry *ent = avlist->getAvatarEntry(agent_id);
		
		if ( ent )
		{
			llinfos << "Trying to teleport to " << ent->getName() << " at " << ent->getPosition() << llendl;
			gAgent.teleportViaLocation( ent->getPosition() );
		}
	}
}
