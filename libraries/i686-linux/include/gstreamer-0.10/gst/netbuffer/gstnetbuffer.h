/* GStreamer
 * Copyright (C) <2005> Wim Taymans <wim@fluendo.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */

#ifndef __GST_NETBUFFER_H__
#define __GST_NETBUFFER_H__

#include <gst/gst.h>

G_BEGIN_DECLS

typedef struct _GstNetBuffer GstNetBuffer;
typedef struct _GstNetBufferClass GstNetBufferClass;

#define GST_TYPE_NETBUFFER            (gst_netbuffer_get_type())
#define GST_IS_NETBUFFER(obj)         (G_TYPE_CHECK_INSTANCE_TYPE ((obj), GST_TYPE_NETBUFFER))
#define GST_IS_NETBUFFER_CLASS(klass) (G_TYPE_CHECK_CLASS_TYPE ((klass), GST_TYPE_NETBUFFER))
#define GST_NETBUFFER_GET_CLASS(obj)  (G_TYPE_INSTANCE_GET_CLASS ((obj), GST_TYPE_NETBUFFER, GstNetBufferClass))
#define GST_NETBUFFER(obj)            (G_TYPE_CHECK_INSTANCE_CAST ((obj), GST_TYPE_NETBUFFER, GstNetBuffer))
#define GST_NETBUFFER_CLASS(klass)    (G_TYPE_CHECK_CLASS_CAST ((klass), GST_TYPE_NETBUFFER, GstNetBufferClass))

/* buffer for use in network sources and sinks.
 *
 * It contains the source or destination address of the buffer.
 */
typedef enum {
  GST_NET_TYPE_UNKNOWN,
  GST_NET_TYPE_IP4,
  GST_NET_TYPE_IP6,
} GstNetType;

typedef struct
{
  GstNetType    type;
  union {
    guint8        ip6[16];
    guint32       ip4;
  } address;
  guint16       port;
  /*< private >*/
  gpointer _gst_reserved[GST_PADDING];
} GstNetAddress;

struct _GstNetBuffer {
  GstBuffer buffer;

  GstNetAddress from;
  GstNetAddress to;

  /*< private >*/
  gpointer _gst_reserved[GST_PADDING];
};

struct _GstNetBufferClass {
  GstBufferClass  buffer_class;

  /*< private >*/
  gpointer _gst_reserved[GST_PADDING];
};

/* creating buffers */
GType           gst_netbuffer_get_type          (void);

GstNetBuffer*   gst_netbuffer_new               (void);

/* address operations */
void            gst_netaddress_set_ip4_address  (GstNetAddress *nadd, guint32 address, guint16 port);
void            gst_netaddress_set_ip6_address  (GstNetAddress *nadd, guint8 address[16], guint16 port);

GstNetType      gst_netaddress_get_net_type     (GstNetAddress *nadd);
gboolean        gst_netaddress_get_ip4_address  (GstNetAddress *nadd, guint32 *address, guint16 *port);
gboolean        gst_netaddress_get_ip6_address  (GstNetAddress *nadd, guint8 address[16], guint16 *port);

G_END_DECLS

#endif /* __GST_NETBUFFER_H__ */

