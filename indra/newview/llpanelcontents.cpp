/**
 * @file llpanelcontents.cpp
 * @brief Object contents panel in the tools floater.
 *
 * $LicenseInfo:firstyear=2001&license=viewergpl$
 * 
 * Copyright (c) 2001-2008, Linden Research, Inc.
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

// file include
#include "llpanelcontents.h"

// linden library includes
#include "llerror.h"
#include "llrect.h"
#include "llstring.h"
#include "llmaterialtable.h"
#include "llfontgl.h"
#include "m3math.h"
#include "llpermissionsflags.h"
#include "lleconomy.h"
#include "material_codes.h"

// project includes
#include "llui.h"
#include "llspinctrl.h"
#include "llcheckboxctrl.h"
#include "lltextbox.h"
#include "llbutton.h"
#include "llcombobox.h"

#include "llagent.h"
#include "llviewerwindow.h"
#include "llworld.h"
#include "llviewerobject.h"
#include "llviewerregion.h"
#include "llresmgr.h"
#include "llselectmgr.h"
#include "llpreviewscript.h"
#include "lltool.h"
#include "lltoolmgr.h"
#include "lltoolcomp.h"
#include "llpanelinventory.h"

// [RLVa:KB] - Checked: 2009-07-06 (RLVa-1.0.0c)
#include "llvoavatar.h"
// [/RLVa:KB]

//
// Imported globals
//


//
// Globals
//

BOOL LLPanelContents::postBuild()
{
	LLRect rect = this->getRect();

	setMouseOpaque(FALSE);

	childSetAction("button new script",&LLPanelContents::onClickNewScript, this);

	return TRUE;
}

LLPanelContents::LLPanelContents(const std::string& name)
	:	LLPanel(name),
		mPanelInventory(NULL)
{
}


LLPanelContents::~LLPanelContents()
{
	// Children all cleaned up by default view destructor.
}


void LLPanelContents::getState(LLViewerObject *objectp )
{
	if( !objectp )
	{
		childSetEnabled("button new script",FALSE);
		//mBtnNewScript->setEnabled( FALSE );
		return;
	}

	LLUUID group_id;			// used for SL-23488
	LLSelectMgr::getInstance()->selectGetGroup(group_id);  // sets group_id as a side effect SL-23488

	// BUG? Check for all objects being editable?
	BOOL editable = gAgent.isGodlike()
					|| (objectp->permModify()
					       && ( objectp->permYouOwner() || ( !group_id.isNull() && gAgent.isInGroup(group_id) )));  // solves SL-23488
	BOOL all_volume = LLSelectMgr::getInstance()->selectionAllPCode( LL_PCODE_VOLUME );

// [RLVa:KB] - Version: 1.22.11 | Checked: 2009-07-06 (RLVa-1.0.0c) | Modified: RLVa-0.2.0g
	if ( (rlv_handler_t::isEnabled()) && (editable) )
	{
		// Don't allow creation of new scripts if it's undetachable
		editable = gRlvHandler.isDetachable(objectp);

		// Don't allow creation of new scripts if we're @unsit=n or @sittp=n restricted and we're sitting on the selection
		if ( (editable) && ((gRlvHandler.hasBehaviour(RLV_BHVR_UNSIT)) || (gRlvHandler.hasBehaviour(RLV_BHVR_SITTP))) )
		{
			LLVOAvatar* pAvatar = gAgent.getAvatarObject();
			// Only check the first (non-)root object because nothing else would result in enabling the button (see below)
			LLViewerObject* pObj = LLSelectMgr::getInstance()->getSelection()->getFirstRootObject(TRUE);

			editable = (pObj) && (pAvatar) && ((!pAvatar->mIsSitting) || (pAvatar->getRoot() != pObj->getRootEdit()));
		}
	}
// [/RLVa:KB]

	// Edit script button - ok if object is editable and there's an
	// unambiguous destination for the object.
	if(	editable &&
		all_volume &&
		((LLSelectMgr::getInstance()->getSelection()->getRootObjectCount() == 1)
					|| (LLSelectMgr::getInstance()->getSelection()->getObjectCount() == 1)))
	{
		//mBtnNewScript->setEnabled(TRUE);
		childSetEnabled("button new script",TRUE);
	}
	else
	{
		//mBtnNewScript->setEnabled(FALSE);
		childSetEnabled("button new script",FALSE);
	}
}


void LLPanelContents::refresh()
{
	const BOOL children_ok = TRUE;
	LLViewerObject* object = LLSelectMgr::getInstance()->getSelection()->getFirstRootObject(children_ok);

	getState(object);
	if (mPanelInventory)
	{
		mPanelInventory->refresh();
	}
}



//
// Static functions
//

// static
void LLPanelContents::onClickNewScript(void *userdata)
{
	const BOOL children_ok = TRUE;
	LLViewerObject* object = LLSelectMgr::getInstance()->getSelection()->getFirstRootObject(children_ok);
	if(object)
	{
// [RLVa:KB] - Checked: 2009-07-06 (RLVa-1.0.0c)
		if (rlv_handler_t::isEnabled())	// Fallback code [see LLPanelContents::getState()]
		{
			if (!gRlvHandler.isDetachable(object))
			{
				return;					// Disallow creating new scripts in a locked attachment
			}
			else if ( (gRlvHandler.hasBehaviour(RLV_BHVR_UNSIT)) || (gRlvHandler.hasBehaviour(RLV_BHVR_SITTP)) )
			{
				LLVOAvatar* pAvatar = gAgent.getAvatarObject();
				if ( (pAvatar) && (pAvatar->mIsSitting) && (pAvatar->getRoot() == object->getRootEdit()) )
					return;				// .. or in a linkset the avie is sitting on under @unsit=n/@sittp=n
			}
		}
// [/RLVa:KB]

		LLPermissions perm;
		perm.init(gAgent.getID(), gAgent.getID(), LLUUID::null, LLUUID::null);
		perm.initMasks(
			PERM_ALL,
			PERM_ALL,
			PERM_NONE,
			PERM_NONE,
			PERM_MOVE | PERM_TRANSFER);
		std::string desc;
		LLAssetType::generateDescriptionFor(LLAssetType::AT_LSL_TEXT, desc);
		LLPointer<LLViewerInventoryItem> new_item =
			new LLViewerInventoryItem(
				LLUUID::null,
				LLUUID::null,
				perm,
				LLUUID::null,
				LLAssetType::AT_LSL_TEXT,
				LLInventoryType::IT_LSL,
				std::string("New Script"),
				desc,
				LLSaleInfo::DEFAULT,
				LLViewerInventoryItem::II_FLAGS_NONE,
				time_corrected());
		object->saveScript(new_item, TRUE, true);

		// *NOTE: In order to resolve SL-22177, we needed to create
		// the script first, and then you have to click it in
		// inventory to edit it.
		// *TODO: The script creation should round-trip back to the
		// viewer so the viewer can auto-open the script and start
		// editing ASAP.
#if 0
		S32 left, top;
		gFloaterView->getNewFloaterPosition(&left, &top);
		LLRect rect = gSavedSettings.getRect("PreviewScriptRect");
		rect.translate( left - rect.mLeft, top - rect.mTop );

		LLLiveLSLEditor* editor;
		editor = new LLLiveLSLEditor("script ed",
									   rect,
									   "Script: New Script",
									   object->mID,
									   LLUUID::null);
		editor->open();	/*Flawfinder: ignore*/

		// keep onscreen
		gFloaterView->adjustToFitScreen(editor, FALSE);
#endif
	}
}
