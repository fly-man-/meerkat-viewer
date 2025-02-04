/** 
 * @file llmodularmath.h
 * @brief Useful modular math functions.
 *
 * $LicenseInfo:firstyear=2008&license=viewergpl$
 * 
 * Copyright (c) 2008, Linden Research, Inc.
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

#ifndef LLMODULARMATH_H
#define LLMODULARMATH_H

namespace LLModularMath
{
    // Return difference between lhs and rhs
    // treating the U32 operands and result
    // as unsigned values of given width.
	template<int width>
	inline U32 subtract(U32 lhs, U32 rhs)
	{
		// Generate a bit mask which will truncate
		// unsigned values to given width at compile time.
		const U32 mask = (1 << width) - 1;
		
		// Operands are unsigned, so modular
		// arithmetic applies. If lhs < rhs,
		// difference will wrap in to lower
		// bits of result, which is then masked
		// to give a value that can be represented
		// by an unsigned value of width bits.
		return mask & (lhs - rhs);
	}	
}

#endif
