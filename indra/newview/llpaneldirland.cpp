/** 
 * @file llpaneldirland.cpp
 * @brief Land For Sale and Auction in the Find directory.
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

#include "llpaneldirland.h"

// linden library includes
#include "llfontgl.h"
#include "llparcel.h"
#include "llqueryflags.h"
#include "message.h"

// viewer project includes
#include "llagent.h"
#include "llcheckboxctrl.h"
#include "llcombobox.h"
#include "lllineeditor.h"
#include "llscrolllistctrl.h"
#include "llstatusbar.h"
#include "lluiconstants.h"
#include "lltextbox.h"
#include "llviewercontrol.h"
#include "llviewermessage.h"

//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------

static const char FIND_ALL[] = "All Types";
static const char FIND_AUCTION[] = "Auction";
static const char FIND_MAINLANDSALES[] = "Mainland Sales";
static const char FIND_ESTATESALES[] = "Estate Sales";

const char PG_ONLY[]     = "PG only";
const char MATURE_ONLY[] = "Mature only";
const char PG_MATURE[]   = "PG & Mature";

LLPanelDirLand::LLPanelDirLand(const std::string& name, LLFloaterDirectory* floater)
	:	LLPanelDirBrowser(name, floater)
{
}

BOOL LLPanelDirLand::postBuild()
{
	LLPanelDirBrowser::postBuild();

	childSetValue("type", gSavedSettings.getString("FindLandType"));


	childSetCommitCallback("pricecheck", onCommitPrice, this);
	childSetCommitCallback("areacheck", onCommitArea, this);

	childSetValue("priceedit", gStatusBar->getBalance());
	childSetEnabled("priceedit", gSavedSettings.getBOOL("FindLandPrice"));
	childSetPrevalidate("priceedit", LLLineEditor::prevalidateNonNegativeS32);
	
	childSetEnabled("areaedit", gSavedSettings.getBOOL("FindLandArea"));
	childSetPrevalidate("areaedit", LLLineEditor::prevalidateNonNegativeS32);

	childSetAction("Search", onClickSearchCore, this);
	setDefaultBtn("Search");

	mCurrentSortColumn = "per_meter";

	LLScrollListCtrl* results = getChild<LLScrollListCtrl>("results");
	if (results)
	{
		results->setSortChangedCallback(onClickSort);
		results->sortByColumn(mCurrentSortColumn,mCurrentSortAscending);
	}

	return TRUE;
}

LLPanelDirLand::~LLPanelDirLand()
{
	// Children all cleaned up by default view destructor.
}


void LLPanelDirLand::onClickSort(void* data)
{
	LLPanelDirLand* self = (LLPanelDirLand*)data;
	if (!self) return;
	self->performQuery();
}

// static 
void LLPanelDirLand::onCommitPrice(LLUICtrl* ctrl, void* data)
{
	LLPanelDirLand* self = (LLPanelDirLand*)data;
	LLCheckBoxCtrl* check = (LLCheckBoxCtrl*)ctrl;

	if (!self || !check) return;
	self->childSetEnabled("priceedit", check->get());
}

// static 
void LLPanelDirLand::onCommitArea(LLUICtrl* ctrl, void* data)
{
	LLPanelDirLand* self = (LLPanelDirLand*)data;
	LLCheckBoxCtrl* check = (LLCheckBoxCtrl*)ctrl;

	if (!self || !check) return;
	self->childSetEnabled("areaedit", check->get());
}

void LLPanelDirLand::performQuery()
{
	LLMessageSystem* msg = gMessageSystem;

	setupNewSearch();

	// We could change the UI to allow arbitrary combinations of these options
	U32 search_type = ST_ALL;
	const std::string& type = childGetValue("type").asString();
	if(!type.empty())
	{
		if (FIND_AUCTION == type) search_type = ST_AUCTION;
		else if(FIND_MAINLANDSALES == type) search_type = ST_MAINLAND;
		else if(FIND_ESTATESALES == type) search_type = ST_ESTATE;
	}

	U32 query_flags = 0x0;

	const std::string& rating = childGetValue("rating").asString();
	if (rating == PG_ONLY)
	{
		query_flags |= DFQ_PG_SIMS_ONLY;
	}
	else if (rating == MATURE_ONLY)
	{
		query_flags |= DFQ_MATURE_SIMS_ONLY;
	}

	LLScrollListCtrl* list = getChild<LLScrollListCtrl>("results");
	if (list)
	{
		std::string sort_name = list->getSortColumnName();
		BOOL sort_asc = list->getSortAscending();

		if (sort_name == "name")
		{
			query_flags |= DFQ_NAME_SORT;
		}
		else if (sort_name == "price")
		{
			query_flags |= DFQ_PRICE_SORT;
		}
		else if (sort_name == "per_meter")
		{
			query_flags |= DFQ_PER_METER_SORT;
		}
		else if (sort_name == "area")
		{
			query_flags |= DFQ_AREA_SORT;
		}

		if (sort_asc)
		{
			query_flags |= DFQ_SORT_ASC;
		}
	}

	if (childGetValue("pricecheck").asBoolean())
	{
		query_flags |= DFQ_LIMIT_BY_PRICE;
	}

	if (childGetValue("areacheck").asBoolean())
	{
		query_flags |= DFQ_LIMIT_BY_AREA;
	}

	msg->newMessage("DirLandQuery");
	msg->nextBlock("AgentData");
	msg->addUUID("AgentID", gAgent.getID());
	msg->addUUID("SessionID", gAgent.getSessionID());
	msg->nextBlock("QueryData");
	msg->addUUID("QueryID", getSearchID());
	msg->addU32("QueryFlags", query_flags);
	msg->addU32("SearchType", search_type);
	msg->addS32("Price", childGetValue("priceedit").asInteger());
	msg->addS32("Area", childGetValue("areaedit").asInteger());
	msg->addS32Fast(_PREHASH_QueryStart,mSearchStart);
	gAgent.sendReliableMessage();
}
