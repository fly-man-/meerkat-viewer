/***************************************************************************/
/*                                                                         */
/*  ftheader.h                                                             */
/*                                                                         */
/*    Build macros of the FreeType 2 library.                              */
/*                                                                         */
/*  Copyright 1996-2001, 2002 by                                           */
/*  David Turner, Robert Wilhelm, and Werner Lemberg.                      */
/*                                                                         */
/*  This file is part of the FreeType project, and may only be used,       */
/*  modified, and distributed under the terms of the FreeType project      */
/*  license, LICENSE.TXT.  By continuing to use, modify, or distribute     */
/*  this file you indicate that you have read the license and              */
/*  understand and accept it fully.                                        */
/*                                                                         */
/***************************************************************************/

#ifndef __FT_HEADER_H__
#define __FT_HEADER_H__

  /*@***********************************************************************/
  /*                                                                       */
  /* <Macro>                                                               */
  /*    FT_BEGIN_HEADER                                                    */
  /*                                                                       */
  /* <Description>                                                         */
  /*    This macro is used in association with @FT_END_HEADER in header    */
  /*    files to ensure that the declarations within are properly          */
  /*    encapsulated in an `extern "C" { .. }' block when included from a  */
  /*    C++ compiler.                                                      */
  /*                                                                       */
#ifdef __cplusplus
#define FT_BEGIN_HEADER  extern "C" {
#else
#define FT_BEGIN_HEADER  /* nothing */
#endif


  /*@***********************************************************************/
  /*                                                                       */
  /* <Macro>                                                               */
  /*    FT_END_HEADER                                                      */
  /*                                                                       */
  /* <Description>                                                         */
  /*    This macro is used in association with @FT_BEGIN_HEADER in header  */
  /*    files to ensure that the declarations within are properly          */
  /*    encapsulated in an `extern "C" { .. }' block when included from a  */
  /*    C++ compiler.                                                      */
  /*                                                                       */
#ifdef __cplusplus
#define FT_END_HEADER  }
#else
#define FT_END_HEADER  /* nothing */
#endif


  /*************************************************************************/
  /*                                                                       */
  /* Aliases for the FreeType 2 public and configuration files.            */
  /*                                                                       */
  /*************************************************************************/

  /*************************************************************************/
  /*                                                                       */
  /* <Section>                                                             */
  /*    header_file_macros                                                 */
  /*                                                                       */
  /* <Title>                                                               */
  /*    Header File Macros                                                 */
  /*                                                                       */
  /* <Abstract>                                                            */
  /*    Macro definitions used to #include specific header files.          */
  /*                                                                       */
  /* <Description>                                                         */
  /*    The following macros are defined to the name of specific           */
  /*    FreeType 2 header files.  They can be used directly in #include    */
  /*    statements as in:                                                  */
  /*                                                                       */
  /*    {                                                                  */
  /*      #include FT_FREETYPE_H                                           */
  /*      #include FT_MULTIPLE_MASTERS_H                                   */
  /*      #include FT_GLYPH_H                                              */
  /*    }                                                                  */
  /*                                                                       */
  /*    There are several reasons why we are now using macros to name      */
  /*    public header files.  The first one is that such macros are not    */
  /*    limited to the infamous 8.3 naming rule required by DOS (and       */
  /*    `FT_MULTIPLE_MASTERS_H' is a lot more meaningful than `ftmm.h').   */
  /*                                                                       */
  /*    The second reason is that is allows for more flexibility in the    */
  /*    way FreeType 2 is installed on a given system.                     */
  /*                                                                       */
  /*************************************************************************/

  /* configuration files */

  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CONFIG_CONFIG_H                                                 */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    FreeType 2 configuration data.                                     */
  /*                                                                       */
#ifndef FT_CONFIG_CONFIG_H
#define FT_CONFIG_CONFIG_H  "llfreetype2/freetype/config/ftconfig.h"
#endif


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CONFIG_STANDARD_LIBRARY_H                                       */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    FreeType 2 configuration data.                                     */
  /*                                                                       */
#ifndef FT_CONFIG_STANDARD_LIBRARY_H
#define FT_CONFIG_STANDARD_LIBRARY_H  "llfreetype2/freetype/config/ftstdlib.h"
#endif


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CONFIG_OPTIONS_H                                                */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    FreeType 2 project-specific configuration options.                 */
  /*                                                                       */
#ifndef FT_CONFIG_OPTIONS_H
#define FT_CONFIG_OPTIONS_H  "llfreetype2/freetype/config/ftoption.h"
#endif


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CONFIG_MODULES_H                                                */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the list of FreeType 2 modules that are statically linked to new   */
  /*    library instances in @FT_Init_FreeType.                            */
  /*                                                                       */
#ifndef FT_CONFIG_MODULES_H
#define FT_CONFIG_MODULES_H  "llfreetype2/freetype/config/ftmodule.h"
#endif

  /* public headers */

  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_FREETYPE_H                                                      */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the base FreeType 2 API.                                           */
  /*                                                                       */
#define FT_FREETYPE_H  "llfreetype2/freetype/freetype.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_ERRORS_H                                                        */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the list of FreeType 2 error codes (and messages).                 */
  /*                                                                       */
  /*    It is included by @FT_FREETYPE_H.                                  */
  /*                                                                       */
#define FT_ERRORS_H  "llfreetype2/freetype/fterrors.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_MODULE_ERRORS_H                                                 */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the list of FreeType 2 module error offsets (and messages).        */
  /*                                                                       */
#define FT_MODULE_ERRORS_H  "llfreetype2/freetype/ftmoderr.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_SYSTEM_H                                                        */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the FreeType 2 interface to low-level operations (i.e. memory      */
  /*    management and stream i/o).                                        */
  /*                                                                       */
  /*    It is included by @FT_FREETYPE_H.                                  */
  /*                                                                       */
#define FT_SYSTEM_H  "llfreetype2/freetype/ftsystem.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_IMAGE_H                                                         */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    types definitions related to glyph images (i.e. bitmaps, outlines, */
  /*    scan-converter parameters).                                        */
  /*                                                                       */
  /*    It is included by @FT_FREETYPE_H.                                  */
  /*                                                                       */
#define FT_IMAGE_H  "llfreetype2/freetype/ftimage.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_TYPES_H                                                         */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the basic data types defined by FreeType 2.                        */
  /*                                                                       */
  /*    It is included by @FT_FREETYPE_H.                                  */
  /*                                                                       */
#define FT_TYPES_H  "llfreetype2/freetype/fttypes.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_LIST_H                                                          */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the list management API of FreeType 2.                             */
  /*                                                                       */
  /*    (Most applications will never need to include this file.)          */
  /*                                                                       */
#define FT_LIST_H  "llfreetype2/freetype/ftlist.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_OUTLINE_H                                                       */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the scalable outline management API of FreeType 2.                 */
  /*                                                                       */
#define FT_OUTLINE_H  "llfreetype2/freetype/ftoutln.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_SIZES_H                                                         */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the API used to manage multiple @FT_Size objects per face.         */
  /*                                                                       */
#define FT_SIZES_H  "llfreetype2/freetype/ftsizes.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_MODULE_H                                                        */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the module management API of FreeType 2.                           */
  /*                                                                       */
#define FT_MODULE_H  "llfreetype2/freetype/ftmodule.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_RENDER_H                                                        */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the renderer module management API of FreeType 2.                  */
  /*                                                                       */
#define FT_RENDER_H  "llfreetype2/freetype/ftrender.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_TYPE1_TABLES_H                                                  */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the types and API specific to the Type 1 format.                   */
  /*                                                                       */
#define FT_TYPE1_TABLES_H  "llfreetype2/freetype/t1tables.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_TRUETYPE_IDS_H                                                  */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the enumeration values used to identify name strings, languages,   */
  /*    encodings, etc.  This file really contains a _large_ set of        */
  /*    constant macro definitions, taken from the TrueType and OpenType   */
  /*    specifications.                                                    */
  /*                                                                       */
#define FT_TRUETYPE_IDS_H  "llfreetype2/freetype/ttnameid.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_TRUETYPE_TABLES_H                                               */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the types and API specific to the TrueType (as well as OpenType)   */
  /*    format.                                                            */
  /*                                                                       */
#define FT_TRUETYPE_TABLES_H  "llfreetype2/freetype/tttables.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_TRUETYPE_TAGS_H                                                 */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the definitions of TrueType 4-byte `tags' used to identify blocks  */
  /*    in SFNT-based font formats (i.e. TrueType and OpenType).           */
  /*                                                                       */
#define FT_TRUETYPE_TAGS_H  "llfreetype2/freetype/tttags.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_BDF_H                                                           */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the definitions of an API to access BDF-specific strings from a    */
  /*    face.                                                              */
  /*                                                                       */
#define FT_BDF_H  "llfreetype2/freetype/ftbdf.h"

  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_GZIP_H                                                          */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the definitions of an API to support for gzip-compressed files.    */
  /*                                                                       */
#define FT_GZIP_H  "llfreetype2/freetype/ftgzip.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_WINFONTS_H                                                      */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the definitions of an API to support Windows .FNT files            */
  /*                                                                       */
#define FT_WINFONTS_H   "llfreetype2/freetype/ftwinfnt.h"

  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_GLYPH_H                                                         */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the API of the optional glyph management component.                */
  /*                                                                       */
#define FT_GLYPH_H  "llfreetype2/freetype/ftglyph.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_BBOX_H                                                          */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the API of the optional exact bounding box computation routines.   */
  /*                                                                       */
#define FT_BBOX_H  "llfreetype2/freetype/ftbbox.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CACHE_H                                                         */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the API of the optional FreeType 2 cache sub-system.               */
  /*                                                                       */
#define FT_CACHE_H  "llfreetype2/freetype/ftcache.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CACHE_IMAGE_H                                                   */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the `glyph image' API of the FreeType 2 cache sub-system.          */
  /*                                                                       */
  /*    It is used to define a cache for @FT_Glyph elements.  You can also */
  /*    see the API defined in @FT_CACHE_SMALL_BITMAPS_H if you only need  */
  /*    to store small glyph bitmaps, as it will use less memory.          */
  /*                                                                       */
#define FT_CACHE_IMAGE_H  "llfreetype2/freetype/cache/ftcimage.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CACHE_SMALL_BITMAPS_H                                           */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the `small bitmaps' API of the FreeType 2 cache sub-system.        */
  /*                                                                       */
  /*    It is used to define a cache for small glyph bitmaps in a          */
  /*    relatively memory-efficient way.  You can also use the API defined */
  /*    in @FT_CACHE_IMAGE_H if you want to cache arbitrary glyph images,  */
  /*    including scalable outlines.                                       */
  /*                                                                       */
#define FT_CACHE_SMALL_BITMAPS_H  "llfreetype2/freetype/cache/ftcsbits.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_CACHE_CHARMAP_H                                                 */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the `charmap' API of the FreeType 2 cache sub-system.              */
  /*                                                                       */
#define FT_CACHE_CHARMAP_H  "llfreetype2/freetype/cache/ftccmap.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_MAC_H                                                           */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the Macintosh-specific FreeType 2 API. The latter is used to       */
  /*    access fonts embedded in resource forks.                           */
  /*                                                                       */
  /*    This header file must be explicitly included by client             */
  /*    applications compiled on the Mac (note that the base API still     */
  /*    works though).                                                     */
  /*                                                                       */
#define FT_MAC_H  "llfreetype2/freetype/ftmac.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_MULTIPLE_MASTERS_H                                              */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the optional multiple-masters management API of FreeType 2.        */
  /*                                                                       */
#define FT_MULTIPLE_MASTERS_H  "llfreetype2/freetype/ftmm.h"


  /*************************************************************************/
  /*                                                                       */
  /* @macro:                                                               */
  /*    FT_SFNT_NAMES_H                                                    */
  /*                                                                       */
  /* @description:                                                         */
  /*    A macro used in #include statements to name the file containing    */
  /*    the optional FreeType 2 API used to access embedded `name' strings */
  /*    in SFNT-based font formats (i.e. TrueType and OpenType).           */
  /*                                                                       */
#define FT_SFNT_NAMES_H  "llfreetype2/freetype/ftsnames.h"

  /* */

#define FT_TRIGONOMETRY_H          "llfreetype2/freetype/fttrigon.h"
#define FT_STROKER_H               "llfreetype2/freetype/ftstroke.h"
#define FT_SYNTHESIS_H             "llfreetype2/freetype/ftsynth.h"
#define FT_ERROR_DEFINITIONS_H     "llfreetype2/freetype/fterrdef.h"

#define FT_CACHE_MANAGER_H         "llfreetype2/freetype/cache/ftcmanag.h"

#define FT_CACHE_INTERNAL_LRU_H    "llfreetype2/freetype/cache/ftlru.h"
#define FT_CACHE_INTERNAL_GLYPH_H  "llfreetype2/freetype/cache/ftcglyph.h"
#define FT_CACHE_INTERNAL_CACHE_H  "llfreetype2/freetype/cache/ftccache.h"

#define FT_XFREE86_H               "llfreetype2/freetype/ftxf86.h"

#define FT_INCREMENTAL_H           "llfreetype2/freetype/ftincrem.h"

#define FT_TRUETYPE_UNPATENTED_H   "llfreetype2/freetype/ttunpat.h"

  /* now include internal headers definitions from "llfreetype2/freetype/internal/..." */

#define  FT_INTERNAL_INTERNAL_H    "llfreetype2/freetype/internal/internal.h"
#include FT_INTERNAL_INTERNAL_H


#endif /* __FT2_BUILD_H__ */


/* END */
