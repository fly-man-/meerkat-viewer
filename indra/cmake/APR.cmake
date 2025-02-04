# -*- cmake -*-

include(BerkeleyDB)
include(Linking)
include(Prebuilt)

set(APR_FIND_QUIETLY ON)
set(APR_FIND_REQUIRED ON)

set(APRUTIL_FIND_QUIETLY ON)
set(APRUTIL_FIND_REQUIRED ON)

if (STANDALONE)
  include(FindAPR)
else (STANDALONE)
  use_prebuilt_binary(apr_suite)
  if (WINDOWS)
    set(WINLIBS_PREBUILT_DEBUG_DIR 
      ${CMAKE_SOURCE_DIR}/../libraries/i686-win32/lib/debug
      )
    set(WINLIBS_PREBUILT_RELEASE_DIR 
      ${CMAKE_SOURCE_DIR}/../libraries/i686-win32/lib/release
      )
    set(APR_LIBRARIES 
      debug ${WINLIBS_PREBUILT_DEBUG_DIR}/apr-1.lib
      optimized ${WINLIBS_PREBUILT_RELEASE_DIR}/apr-1.lib
      )
    set(APRUTIL_LIBRARIES 
      debug ${WINLIBS_PREBUILT_DEBUG_DIR}/aprutil-1.lib
      optimized ${WINLIBS_PREBUILT_RELEASE_DIR}/aprutil-1.lib
      )
    set(APRICONV_LIBRARIES 
      debug ${WINLIBS_PREBUILT_DEBUG_DIR}/apriconv-1.lib
      optimized ${WINLIBS_PREBUILT_RELEASE_DIR}/apriconv-1.lib
      )
  elseif (DARWIN)
    set(APR_LIBRARIES 
      debug ${ARCH_PREBUILT_DIRS_DEBUG}/libapr-1.a
      optimized ${ARCH_PREBUILT_DIRS_RELEASE}/libapr-1.a
      )
    set(APRUTIL_LIBRARIES 
      debug ${ARCH_PREBUILT_DIRS_DEBUG}/libaprutil-1.a
      optimized ${ARCH_PREBUILT_DIRS_RELEASE}/libaprutil-1.a
      )
    set(APRICONV_LIBRARIES iconv)
  else (WINDOWS)
    set(APR_LIBRARIES apr-1)
    set(APRUTIL_LIBRARIES aprutil-1)
    set(APRICONV_LIBRARIES iconv)
  endif (WINDOWS)
  set(APR_INCLUDE_DIR ${LIBS_PREBUILT_DIR}/${LL_ARCH_DIR}/include/apr-1)

  if (LINUX AND VIEWER)
    list(APPEND APRUTIL_LIBRARIES ${DB_LIBRARIES})
  endif (LINUX AND VIEWER)
endif (STANDALONE)
