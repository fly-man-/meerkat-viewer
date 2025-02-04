/** 
 * @file llflexibleobject.cpp
 * @brief Flexible object implementation
 *
 * $LicenseInfo:firstyear=2006&license=viewergpl$
 * 
 * Copyright (c) 2006-2008, Linden Research, Inc.
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

#include "pipeline.h"
#include "lldrawpoolbump.h"
#include "llface.h"
#include "llflexibleobject.h"
#include "llglheaders.h"
#include "llrendersphere.h"
#include "llviewerobject.h"
#include "llimagegl.h"
#include "llagent.h"
#include "llsky.h"
#include "llviewercamera.h"
#include "llviewerimagelist.h"
#include "llviewercontrol.h"
#include "llviewerobjectlist.h"
#include "llviewerregion.h"
#include "llworld.h"
#include "llvoavatar.h"

/*static*/ F32 LLVolumeImplFlexible::sUpdateFactor = 1.0f;

// LLFlexibleObjectData::pack/unpack now in llprimitive.cpp

//-----------------------------------------------
// constructor
//-----------------------------------------------
LLVolumeImplFlexible::LLVolumeImplFlexible(LLViewerObject* vo, LLFlexibleObjectData* attributes) :
		mVO(vo), mAttributes(attributes)
{
	static U32 seed = 0;
	mID = seed++;
	mInitialized = FALSE;
	mUpdated = FALSE;
	mInitializedRes = -1;
	mSimulateRes = 0;
	mFrameNum = 0;
	mRenderRes = 1;

	if(mVO->mDrawable.notNull())
	{
		mVO->mDrawable->makeActive() ;
	}
}//-----------------------------------------------

LLVector3 LLVolumeImplFlexible::getFramePosition() const
{
	return mVO->getRenderPosition();
}

LLQuaternion LLVolumeImplFlexible::getFrameRotation() const
{
	return mVO->getRenderRotation();
}

void LLVolumeImplFlexible::onParameterChanged(U16 param_type, LLNetworkData *data, BOOL in_use, bool local_origin)
{
	if (param_type == LLNetworkData::PARAMS_FLEXIBLE)
	{
		mAttributes = (LLFlexibleObjectData*)data;
		setAttributesOfAllSections();
	}
}

void LLVolumeImplFlexible::onShift(const LLVector3 &shift_vector)
{	
	for (int section = 0; section < (1<<FLEXIBLE_OBJECT_MAX_SECTIONS)+1; ++section)
	{
		mSection[section].mPosition += shift_vector;	
	}
}

//-----------------------------------------------------------------------------------------------
void LLVolumeImplFlexible::setParentPositionAndRotationDirectly( LLVector3 p, LLQuaternion r )
{
	mParentPosition = p;
	mParentRotation = r;

}//-----------------------------------------------------------------------------------------------------

void LLVolumeImplFlexible::remapSections(LLFlexibleObjectSection *source, S32 source_sections,
										 LLFlexibleObjectSection *dest, S32 dest_sections)
{	
	S32 num_output_sections = 1<<dest_sections;
	LLVector3 scale = mVO->mDrawable->getScale();
	F32 source_section_length = scale.mV[VZ] / (F32)(1<<source_sections);
	F32 section_length = scale.mV[VZ] / (F32)num_output_sections;
	if (source_sections == -1)
	{
		// Generate all from section 0
		dest[0] = source[0];
		for (S32 section=0; section<num_output_sections; ++section)
		{
			dest[section+1] = dest[section];
			dest[section+1].mPosition += dest[section].mDirection * section_length;
			dest[section+1].mVelocity.setVec( LLVector3::zero );
		}
	}
	else if (source_sections > dest_sections)
	{
		// Copy, skipping sections

		S32 num_steps = 1<<(source_sections-dest_sections);

		// Copy from left to right since it may be an in-place computation
		for (S32 section=0; section<num_output_sections; ++section)
		{
			dest[section+1] = source[(section+1)*num_steps];
		}
		dest[0] = source[0];
	}
	else if (source_sections < dest_sections)
	{
		// Interpolate section info
		// Iterate from right to left since it may be an in-place computation
		S32 step_shift = dest_sections-source_sections;
		S32 num_steps = 1<<step_shift;
		for (S32 section=num_output_sections-num_steps; section>=0; section -= num_steps)
		{
			LLFlexibleObjectSection *last_source_section = &source[section>>step_shift];
			LLFlexibleObjectSection *source_section = &source[(section>>step_shift)+1];

			// Cubic interpolation of position
			// At^3 + Bt^2 + Ct + D = f(t)
			LLVector3 D = last_source_section->mPosition;
			LLVector3 C = last_source_section->mdPosition * source_section_length;
			LLVector3 Y = source_section->mdPosition * source_section_length - C; // Helper var
			LLVector3 X = (source_section->mPosition - D - C); // Helper var
			LLVector3 A = Y - 2*X;
			LLVector3 B = X - A;

			F32 t_inc = 1.f/F32(num_steps);
			F32 t = t_inc;
			for (S32 step=1; step<num_steps; ++step)
			{
				dest[section+step].mScale = 
					lerp(last_source_section->mScale, source_section->mScale, t);
				dest[section+step].mAxisRotation = 
					slerp(t, last_source_section->mAxisRotation, source_section->mAxisRotation);

				// Evaluate output interpolated values
				F32 t_sq = t*t;
				dest[section+step].mPosition = t_sq*(t*A + B) + t*C + D;
				dest[section+step].mRotation = 
					slerp(t, last_source_section->mRotation, source_section->mRotation);
				dest[section+step].mVelocity = lerp(last_source_section->mVelocity, source_section->mVelocity, t);
				dest[section+step].mDirection = lerp(last_source_section->mDirection, source_section->mDirection, t);
				dest[section+step].mdPosition = lerp(last_source_section->mdPosition, source_section->mdPosition, t);
				dest[section+num_steps] = *source_section;
				t += t_inc;
			}
		}
		dest[0] = source[0];
	}
	else
	{
		// numbers are equal. copy info
		for (S32 section=0; section <= num_output_sections; ++section)
		{
			dest[section] = source[section];
		}
	}
}


//-----------------------------------------------------------------------------
void LLVolumeImplFlexible::setAttributesOfAllSections(LLVector3* inScale)
{
	LLVector2 bottom_scale, top_scale;
	F32 begin_rot = 0, end_rot = 0;
	if (mVO->getVolume())
	{
		const LLPathParams &params = mVO->getVolume()->getParams().getPathParams();
		// Fix for odd taper that is applied to sculpts. Force to 1,1. ~Zwa0908
		bottom_scale = isSculptedFlex() ? LLVector2(1.f, 1.f) : params.getBeginScale();
		top_scale = isSculptedFlex() ? LLVector2(1.f, 1.f) : params.getEndScale();
		begin_rot = F_PI * params.getTwistBegin();
		end_rot = F_PI * params.getTwist();
	}

	if (!mVO->mDrawable)
	{
		return;
	}
	
	S32 num_sections = 1 << mSimulateRes;

	LLVector3 scale;
	if (inScale == (LLVector3*)NULL)
	{
		scale = mVO->mDrawable->getScale();
	}
	else
	{
		scale = *inScale;
	}

	mSection[0].mPosition = getAnchorPosition();
	mSection[0].mDirection = LLVector3::z_axis * getFrameRotation();
	mSection[0].mdPosition = mSection[0].mDirection;
	mSection[0].mScale.setVec(scale.mV[VX]*bottom_scale.mV[0], scale.mV[VY]*bottom_scale.mV[1]);
	mSection[0].mVelocity.setVec(0,0,0);
	mSection[0].mAxisRotation.setQuat(begin_rot,0,0,1);

	LLVector3 parentSectionPosition = mSection[0].mPosition;
	LLVector3 last_direction = mSection[0].mDirection;

	remapSections(mSection, mInitializedRes, mSection, mSimulateRes);
	mInitializedRes = mSimulateRes;

	F32 t_inc = 1.f/F32(num_sections);
	F32 t = t_inc;

	for ( int i=1; i<= num_sections; i++)
	{
		mSection[i].mAxisRotation.setQuat(lerp(begin_rot,end_rot,t),0,0,1);
		mSection[i].mScale = LLVector2(
			scale.mV[VX] * lerp(bottom_scale.mV[0], top_scale.mV[0], t), 
			scale.mV[VY] * lerp(bottom_scale.mV[1], top_scale.mV[1], t));
		t += t_inc;
	}
}//-----------------------------------------------------------------------------------


void LLVolumeImplFlexible::onSetVolume(const LLVolumeParams &volume_params, const S32 detail)
{
}

//---------------------------------------------------------------------------------
// This calculates the physics of the flexible object. Note that it has to be 0
// updated every time step. In the future, perhaps there could be an 
// optimization similar to what Havok does for objects that are stationary. 
//---------------------------------------------------------------------------------
BOOL LLVolumeImplFlexible::doIdleUpdate(LLAgent &agent, LLWorld &world, const F64 &time)
{
	if (mVO->mDrawable.isNull())
	{
		// Don't do anything until we have a drawable
		return FALSE; // (we are not initialized or updated)
	}

	BOOL force_update = mSimulateRes == 0 ? TRUE : FALSE;

	//flexible objects never go static
	mVO->mDrawable->mQuietCount = 0;
	if (!mVO->mDrawable->isRoot())
	{
		LLViewerObject* parent = (LLViewerObject*) mVO->getParent();
		parent->mDrawable->mQuietCount = 0;
	}

	LLFastTimer ftm(LLFastTimer::FTM_FLEXIBLE_UPDATE);
		
	S32 new_res = mAttributes->getSimulateLOD();

	//number of segments only cares about z axis
	F32 app_angle = llround((F32) atan2( mVO->getScale().mV[2]*2.f, mVO->mDrawable->mDistanceWRTCamera) * RAD_TO_DEG, 0.01f);

	// Rendering sections increases with visible angle on the screen
	mRenderRes = (S32)(FLEXIBLE_OBJECT_MAX_SECTIONS*4*app_angle*DEG_TO_RAD/LLViewerCamera::getInstance()->getView());
	if (mRenderRes > FLEXIBLE_OBJECT_MAX_SECTIONS)
	{
		mRenderRes = FLEXIBLE_OBJECT_MAX_SECTIONS;
	}


	// Bottom cap at 1/4 the original number of sections
	if (mRenderRes < mAttributes->getSimulateLOD()-1)
	{
		mRenderRes = mAttributes->getSimulateLOD()-1;
	}
	// Throttle back simulation of segments we're not rendering
	if (mRenderRes < new_res)
	{
		new_res = mRenderRes;
	}

	if (!mInitialized || (mSimulateRes != new_res))
	{
		mSimulateRes = new_res;
		setAttributesOfAllSections();
		mInitialized = TRUE;
	}
	if (!gPipeline.hasRenderDebugFeatureMask(LLPipeline::RENDER_DEBUG_FEATURE_FLEXIBLE))
	{
		return FALSE; // (we are not initialized or updated)
	}

	if (force_update)
	{
		gPipeline.markRebuild(mVO->mDrawable, LLDrawable::REBUILD_POSITION, FALSE);
	}
	else if	(mVO->mDrawable->isVisible() &&
		!mVO->mDrawable->isState(LLDrawable::IN_REBUILD_Q1) &&
		mVO->getPixelArea() > 256.f)
	{
		U32 id;
		F32 pixel_area = mVO->getPixelArea();

		if (mVO->isRootEdit())
		{
			id = mID;
		}
		else
		{
			LLVOVolume* parent = (LLVOVolume*) mVO->getParent();
			id = parent->getVolumeInterfaceID();
		}

		U32 update_period = (U32) (LLViewerCamera::getInstance()->getScreenPixelArea()*0.01f/(pixel_area*(sUpdateFactor+1.f)))+1;

		if ((LLDrawable::getCurrentFrame()+id)%update_period == 0)
		{
			gPipeline.markRebuild(mVO->mDrawable, LLDrawable::REBUILD_POSITION, FALSE);
		}
	}
	
	return force_update;
}

inline S32 log2(S32 x)
{
	S32 ret = 0;
	while (x > 1)
	{
		++ret;
		x >>= 1;
	}
	return ret;
}

void LLVolumeImplFlexible::doFlexibleUpdate()
{
	LLVolume* volume = mVO->getVolume();
	LLPath *path = &volume->getPath();
	if (mSimulateRes == 0)
	{
		mVO->markForUpdate(TRUE);
		if (!doIdleUpdate(gAgent, *LLWorld::getInstance(), 0.0))
		{
			return;	// we did not get updated or initialized, proceeding without can be dangerous
		}
	}

	llassert_always(mInitialized);
	
	S32 num_sections = 1 << mSimulateRes;

    F32 secondsThisFrame = mTimer.getElapsedTimeAndResetF32();
	if (secondsThisFrame > 0.2f)
	{
		secondsThisFrame = 0.2f;
	}

	LLVector3 BasePosition = getFramePosition();
	LLQuaternion BaseRotation = getFrameRotation();
	LLQuaternion parentSegmentRotation = BaseRotation;
	LLVector3 anchorDirectionRotated = LLVector3::z_axis * parentSegmentRotation;
	LLVector3 anchorScale = mVO->mDrawable->getScale();
	
	F32 section_length = anchorScale.mV[VZ] / (F32)num_sections;
	F32 inv_section_length = 1.f / section_length;

	S32 i;

	// ANCHOR position is offset from BASE position (centroid) by half the length
	LLVector3 AnchorPosition = BasePosition - (anchorScale.mV[VZ]/2 * anchorDirectionRotated);
	
	mSection[0].mPosition = AnchorPosition;
	mSection[0].mDirection = anchorDirectionRotated;
	mSection[0].mRotation = BaseRotation;

	LLQuaternion deltaRotation;

	LLVector3 lastPosition;

	// Coefficients which are constant across sections
	F32 t_factor = mAttributes->getTension() * 0.1f;
	t_factor = t_factor*(1 - pow(0.85f, secondsThisFrame*30));
	if ( t_factor > FLEXIBLE_OBJECT_MAX_INTERNAL_TENSION_FORCE )
	{
		t_factor = FLEXIBLE_OBJECT_MAX_INTERNAL_TENSION_FORCE;
	}

	F32 friction_coeff = (mAttributes->getAirFriction()*2+1);
	friction_coeff = pow(10.f, friction_coeff*secondsThisFrame);
	friction_coeff = (friction_coeff > 1) ? friction_coeff : 1;
	F32 momentum = 1.0f / friction_coeff;

	F32 wind_factor = (mAttributes->getWindSensitivity()*0.1f) * section_length * secondsThisFrame;
	F32 max_angle = atan(section_length*2.f);

	F32 force_factor = section_length * secondsThisFrame;

	// Update simulated sections
	for (i=1; i<=num_sections; ++i)
	{
		LLVector3 parentSectionVector;
		LLVector3 parentSectionPosition;
		LLVector3 parentDirection;

		//---------------------------------------------------
		// save value of position as lastPosition
		//---------------------------------------------------
		lastPosition = mSection[i].mPosition;

		//------------------------------------------------------------------------------------------
		// gravity
		//------------------------------------------------------------------------------------------
		mSection[i].mPosition.mV[2] -= mAttributes->getGravity() * force_factor;

		//------------------------------------------------------------------------------------------
		// wind force
		//------------------------------------------------------------------------------------------
		if (mAttributes->getWindSensitivity() > 0.001f)
		{
			mSection[i].mPosition += gAgent.getRegion()->mWind.getVelocity( mSection[i].mPosition ) * wind_factor;
		}

		//------------------------------------------------------------------------------------------
		// user-defined force
		//------------------------------------------------------------------------------------------
		mSection[i].mPosition += mAttributes->getUserForce() * force_factor;

		//---------------------------------------------------
		// tension (rigidity, stiffness)
		//---------------------------------------------------
		parentSectionPosition = mSection[i-1].mPosition;
		parentDirection = mSection[i-1].mDirection;

		if ( i == 1 )
		{
			parentSectionVector = mSection[0].mDirection;
		}
		else
		{
			parentSectionVector = mSection[i-2].mDirection;
		}

		LLVector3 currentVector = mSection[i].mPosition - parentSectionPosition;

		LLVector3 difference = (parentSectionVector*section_length) - currentVector;
		LLVector3 tensionForce = difference * t_factor;

		mSection[i].mPosition += tensionForce;

		//------------------------------------------------------------------------------------------
		// sphere collision, currently not used
		//------------------------------------------------------------------------------------------
		/*if ( mAttributes->mUsingCollisionSphere )
		{
			LLVector3 vectorToCenterOfCollisionSphere = mCollisionSpherePosition - mSection[i].mPosition;
			if ( vectorToCenterOfCollisionSphere.magVecSquared() < mCollisionSphereRadius * mCollisionSphereRadius )
			{
				F32 distanceToCenterOfCollisionSphere = vectorToCenterOfCollisionSphere.magVec();
				F32 penetration = mCollisionSphereRadius - distanceToCenterOfCollisionSphere;

				LLVector3 normalToCenterOfCollisionSphere;
				
				if ( distanceToCenterOfCollisionSphere > 0.0f )
				{
					normalToCenterOfCollisionSphere = vectorToCenterOfCollisionSphere / distanceToCenterOfCollisionSphere;
				}
				else // rare
				{
					normalToCenterOfCollisionSphere = LLVector3::x_axis; // arbitrary
				}

				// push the position out to the surface of the collision sphere
				mSection[i].mPosition -= normalToCenterOfCollisionSphere * penetration;
			}
		}*/

		//------------------------------------------------------------------------------------------
		// inertia
		//------------------------------------------------------------------------------------------
		mSection[i].mPosition += mSection[i].mVelocity * momentum;

		//------------------------------------------------------------------------------------------
		// clamp length & rotation
		//------------------------------------------------------------------------------------------
		mSection[i].mDirection = mSection[i].mPosition - parentSectionPosition;
		mSection[i].mDirection.normVec();
		deltaRotation.shortestArc( parentDirection, mSection[i].mDirection );

		F32 angle;
		LLVector3 axis;
		deltaRotation.getAngleAxis(&angle, axis);
		if (angle > F_PI) angle -= 2.f*F_PI;
		if (angle < -F_PI) angle += 2.f*F_PI;
		if (angle > max_angle)
		{
			//angle = 0.5f*(angle+max_angle);
			deltaRotation.setQuat(max_angle, axis);
		} else if (angle < -max_angle)
		{
			//angle = 0.5f*(angle-max_angle);
			deltaRotation.setQuat(-max_angle, axis);
		}
		LLQuaternion segment_rotation = parentSegmentRotation * deltaRotation;
		parentSegmentRotation = segment_rotation;

		mSection[i].mDirection = (parentDirection * deltaRotation);
		mSection[i].mPosition = parentSectionPosition + mSection[i].mDirection * section_length;
		mSection[i].mRotation = segment_rotation;

		if (i > 1)
		{
			// Propogate half the rotation up to the parent
			LLQuaternion halfDeltaRotation(angle/2, axis);
			mSection[i-1].mRotation = mSection[i-1].mRotation * halfDeltaRotation;
		}

		//------------------------------------------------------------------------------------------
		// calculate velocity
		//------------------------------------------------------------------------------------------
		mSection[i].mVelocity = mSection[i].mPosition - lastPosition;
		if (mSection[i].mVelocity.magVecSquared() > 1.f)
		{
			mSection[i].mVelocity.normVec();
		}
	}

	// Calculate derivatives (not necessary until normals are automagically generated)
	mSection[0].mdPosition = (mSection[1].mPosition - mSection[0].mPosition) * inv_section_length;
	// i = 1..NumSections-1
	for (i=1; i<num_sections; ++i)
	{
		// Quadratic numerical derivative of position

		// f(-L1) = aL1^2 - bL1 + c = f1
		// f(0)   =               c = f2
		// f(L2)  = aL2^2 + bL2 + c = f3
		// f = ax^2 + bx + c
		// d/dx f = 2ax + b
		// d/dx f(0) = b

		// c = f2
		// a = [(f1-c)/L1 + (f3-c)/L2] / (L1+L2)
		// b = (f3-c-aL2^2)/L2

		LLVector3 a = (mSection[i-1].mPosition-mSection[i].mPosition +
					mSection[i+1].mPosition-mSection[i].mPosition) * 0.5f * inv_section_length * inv_section_length;
		LLVector3 b = (mSection[i+1].mPosition-mSection[i].mPosition - a*(section_length*section_length));
		b *= inv_section_length;

		mSection[i].mdPosition = b;
	}

	// i = NumSections
	mSection[i].mdPosition = (mSection[i].mPosition - mSection[i-1].mPosition) * inv_section_length;

	// Create points
	// ZWAGOTH
	S32 path_jump = isSculptedFlex() ? 2 : 1;
	S32 num_render_sections = 1<<mRenderRes;
	if (path->getPathLength() != num_render_sections*path_jump+1)
	{
		((LLVOVolume*) mVO)->mVolumeChanged = TRUE;
		volume->resizePath(num_render_sections*path_jump+1);
	}

	LLPath::PathPt *new_point;

	LLFlexibleObjectSection newSection[ (1<<FLEXIBLE_OBJECT_MAX_SECTIONS)+1 ];
	remapSections(mSection, mSimulateRes, newSection, mRenderRes);

	//generate transform from global to prim space
	LLVector3 delta_scale = LLVector3(1,1,1);
	LLVector3 delta_pos;
	LLQuaternion delta_rot;

	delta_rot = ~getFrameRotation();
	delta_pos = -getFramePosition()*delta_rot;
		
	// Vertex transform (4x4)
	LLVector3 x_axis = LLVector3(delta_scale.mV[VX], 0.f, 0.f) * delta_rot;
	LLVector3 y_axis = LLVector3(0.f, delta_scale.mV[VY], 0.f) * delta_rot;
	LLVector3 z_axis = LLVector3(0.f, 0.f, delta_scale.mV[VZ]) * delta_rot;

	LLMatrix4 rel_xform;
	rel_xform.initRows(LLVector4(x_axis, 0.f),
								LLVector4(y_axis, 0.f),
								LLVector4(z_axis, 0.f),
								LLVector4(delta_pos, 1.f));

	//ZWAGOTH	
	for (i=0; i<=num_render_sections; ++i)
	{
		new_point = &path->mPath[i*path_jump];
		LLVector3 pos = newSection[i].mPosition * rel_xform;
		LLQuaternion rot = mSection[i].mAxisRotation * newSection[i].mRotation * delta_rot;
		
		if (!mUpdated || (new_point->mPos-pos).magVec()/mVO->mDrawable->mDistanceWRTCamera > 0.001f)
		{
			new_point->mPos = newSection[i].mPosition * rel_xform;
			mUpdated = FALSE;
		}

		new_point->mRot = rot;
		new_point->mScale = newSection[i].mScale;
		new_point->mTexT = ((F32)i*path_jump)/(num_render_sections*path_jump);
	}

	//ZWAGOTH
	if(isSculptedFlex())
	{
		LLPath::PathPt *prev_point, *next_point;
		for(i=1; i<=(num_render_sections*path_jump); i+=path_jump)
		{
			new_point = &path->mPath[i];
			prev_point = &path->mPath[i-1];
			next_point = &path->mPath[i+1];

			new_point->mPos = lerp(prev_point->mPos,next_point->mPos,0.5f);
			new_point->mRot = lerp(0.5f,prev_point->mRot,next_point->mRot);
			new_point->mScale = lerp(prev_point->mScale,next_point->mScale,0.5);
			new_point->mTexT = ((F32)i)/(num_render_sections*path_jump);
		}
	}


	mLastSegmentRotation = parentSegmentRotation;
}

void LLVolumeImplFlexible::preRebuild()
{
	if (!mUpdated)
	{
		doFlexibleRebuild();
	}
}

void LLVolumeImplFlexible::doFlexibleRebuild()
{
    //ZWAGOTH
    if(((LLVOVolume*)mVO)->isSculpted())
    {
        LLVOVolume* vovol = (LLVOVolume*)mVO;
        vovol->sculpt();
    }
    else
    {
        LLVolume* volume = mVO->getVolume();
        volume->regen();
    }
	
	mUpdated = TRUE;
}

//------------------------------------------------------------------

void LLVolumeImplFlexible::onSetScale(const LLVector3& scale, BOOL damped)
{
	setAttributesOfAllSections((LLVector3*) &scale);
}

BOOL LLVolumeImplFlexible::doUpdateGeometry(LLDrawable *drawable)
{
	LLVOVolume *volume = (LLVOVolume*)mVO;

	if (mVO->isAttachment())
	{	//don't update flexible attachments for impostored avatars unless the 
		//impostor is being updated this frame (w00!)
		LLViewerObject* parent = (LLViewerObject*) mVO->getParent();
		while (parent && !parent->isAvatar())
		{
			parent = (LLViewerObject*) parent->getParent();
		}
		
		if (parent)
		{
			LLVOAvatar* avatar = (LLVOAvatar*) parent;
			if (avatar->isImpostor() && !avatar->needsImpostorUpdate())
			{
				return TRUE;
			}
		}
	}

	if (volume->mDrawable.isNull())
	{
		return TRUE; // No update to complete
	}

	if (volume->mLODChanged)
	{
		LLVolumeParams volume_params = volume->getVolume()->getParams();
		volume->setVolume(volume_params, 0);
		mUpdated = FALSE;
	}

	volume->updateRelativeXform();
	doFlexibleUpdate();
	
	// Object may have been rotated, which means it needs a rebuild.  See SL-47220
	BOOL	rotated = FALSE;
	LLQuaternion cur_rotation = getFrameRotation();
	if ( cur_rotation != mLastFrameRotation )
	{
		mLastFrameRotation = cur_rotation;
		rotated = TRUE;
	}

	if (volume->mLODChanged || volume->mFaceMappingChanged ||
		volume->mVolumeChanged)
	{
		volume->regenFaces();
		volume->mDrawable->setState(LLDrawable::REBUILD_VOLUME);
		volume->dirtySpatialGroup();
		doFlexibleRebuild();
		volume->genBBoxes(isVolumeGlobal());
	}
	else if (!mUpdated || rotated)
	{
		volume->mDrawable->setState(LLDrawable::REBUILD_POSITION);
		volume->dirtyMesh();
		volume->genBBoxes(isVolumeGlobal());
	}
			
	volume->mVolumeChanged = FALSE;
	volume->mLODChanged = FALSE;
	volume->mFaceMappingChanged = FALSE;

	// clear UV flag
	drawable->clearState(LLDrawable::UV);
	
	return TRUE;
}

//----------------------------------------------------------------------------------
void LLVolumeImplFlexible::setCollisionSphere( LLVector3 p, F32 r )
{
	mCollisionSpherePosition = p;
	mCollisionSphereRadius   = r;

}//------------------------------------------------------------------


//----------------------------------------------------------------------------------
void LLVolumeImplFlexible::setUsingCollisionSphere( bool u )
{
}//------------------------------------------------------------------


//----------------------------------------------------------------------------------
void LLVolumeImplFlexible::setRenderingCollisionSphere( bool r )
{
}//------------------------------------------------------------------

//------------------------------------------------------------------
LLVector3 LLVolumeImplFlexible::getEndPosition()
{
	S32 num_sections = 1 << mAttributes->getSimulateLOD();
	return mSection[ num_sections ].mPosition;

}//------------------------------------------------------------------


//------------------------------------------------------------------
LLVector3 LLVolumeImplFlexible::getNodePosition( int nodeIndex )
{
	S32 num_sections = 1 << mAttributes->getSimulateLOD();
	if ( nodeIndex > num_sections - 1 )
	{
		nodeIndex = num_sections - 1;
	}
	else if ( nodeIndex < 0 ) 
	{
		nodeIndex = 0;
	}

	return mSection[ nodeIndex ].mPosition;

}//------------------------------------------------------------------

LLVector3 LLVolumeImplFlexible::getPivotPosition() const
{
	return getAnchorPosition();
}

//------------------------------------------------------------------
LLVector3 LLVolumeImplFlexible::getAnchorPosition() const
{
	LLVector3 BasePosition = getFramePosition();
	LLQuaternion parentSegmentRotation = getFrameRotation();
	LLVector3 anchorDirectionRotated = LLVector3::z_axis * parentSegmentRotation;
	LLVector3 anchorScale = mVO->mDrawable->getScale();
	return BasePosition - (anchorScale.mV[VZ]/2 * anchorDirectionRotated);

}//------------------------------------------------------------------


//------------------------------------------------------------------
LLQuaternion LLVolumeImplFlexible::getEndRotation()
{
	return mLastSegmentRotation;

}//------------------------------------------------------------------


void LLVolumeImplFlexible::updateRelativeXform()
{
	LLQuaternion delta_rot;
	LLVector3 delta_pos, delta_scale;
	LLVOVolume* vo = (LLVOVolume*) mVO;

	//matrix from local space to parent relative/global space
	delta_rot = vo->mDrawable->isSpatialRoot() ? LLQuaternion() : vo->mDrawable->getRotation();
	delta_pos = vo->mDrawable->isSpatialRoot() ? LLVector3(0,0,0) : vo->mDrawable->getPosition();
	delta_scale = LLVector3(1,1,1);

	// Vertex transform (4x4)
	LLVector3 x_axis = LLVector3(delta_scale.mV[VX], 0.f, 0.f) * delta_rot;
	LLVector3 y_axis = LLVector3(0.f, delta_scale.mV[VY], 0.f) * delta_rot;
	LLVector3 z_axis = LLVector3(0.f, 0.f, delta_scale.mV[VZ]) * delta_rot;

	vo->mRelativeXform.initRows(LLVector4(x_axis, 0.f),
							LLVector4(y_axis, 0.f),
							LLVector4(z_axis, 0.f),
							LLVector4(delta_pos, 1.f));
			
	x_axis.normVec();
	y_axis.normVec();
	z_axis.normVec();
	
	vo->mRelativeXformInvTrans.setRows(x_axis, y_axis, z_axis);
}

const LLMatrix4& LLVolumeImplFlexible::getWorldMatrix(LLXformMatrix* xform) const
{
	return xform->getWorldMatrix();
}
