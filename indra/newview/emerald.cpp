/* Copyright (c) 2009
 *
 * Modular Systems. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or
 * without modification, are permitted provided that the following
 * conditions are met:
 *
 *   1. Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *   2. Redistributions in binary form must reproduce the above
 *      copyright notice, this list of conditions and the following
 *      disclaimer in the documentation and/or other materials provided
 *      with the distribution.
 *   3. Neither the name Modular Systems nor the names of its contributors
 *      may be used to endorse or promote products derived from this
 *      software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY MODULAR SYSTEMS AND CONTRIBUTORS �AS IS�
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL MODULAR SYSTEMS OR CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#include "emerald.h"
#include <sstream>
#include <cstring>

//-- Ascii85 encoder and decoder

typedef unsigned int U32;

static void encodeU32(unsigned int in, char *out)
{
	out[4] = char(in % 85) + char(33);
	in /= 85;
	out[3] = char(in % 85) + char(33);
	in /= 85;
	out[2] = char(in % 85) + char(33);
	in /= 85;
	out[1] = char(in % 85) + char(33);
	in /= 85;
	out[0] = char(in % 85) + char(33);
}

static unsigned int decodeU32(const char *in)
{
	U32 out;

	out = U32(in[0] - 33);
	out *= 85;
	out += U32(in[1] - 33);
	out *= 85;
	out += U32(in[2] - 33);
	out *= 85;
	out += U32(in[3] - 33);
	out *= 85;
	out += U32(in[4] - 33);

	return out;
}

// static
std::string EAscii85::encode(const std::vector<unsigned char> &in)
{
	std::ostringstream out;
	U32 tuple;
	int count;
	char block[6];
	block[5] = '\0';

	out << "<~";

	count = 0;
	tuple = 0;
	for(size_t i = 0; i < in.size(); i++)
	{
		tuple <<= 8;
		tuple += in[i];
		if(++count == 4)
		{
			if(tuple == 0)
			{
				out << "z";
			}
			else
			{
				encodeU32(tuple, block);
				out << block;
			}
			count = 0;
		}
	}

	switch(count)
	{
	case 1:
		tuple <<= 8;
		tuple += 255;
		// pass through
	case 2:
		tuple <<= 8;
		tuple += 255;
		// pass through
	case 3:
		tuple <<= 8;
		tuple += 255;
	}
	
	encodeU32(tuple, block);

	switch(count)
	{
	case 1:
		block[2] = '\0';
		break;
	case 2:
		block[3] = '\0';
		break;
	case 3:
		block[4] = '\0';
		break;
	}

	if(count > 0)
		out << block;

	out << "~>";

	return out.str();
}

// static
std::vector<unsigned char> EAscii85::decode(const std::string &in)
{
	std::vector<unsigned char> out;
	size_t len;
	int count = 0;
	char block[6];
	block[5] = '\0';
	U32 tuple;

	// approximate length
	len = in.length() / 5 * 4;

	out.clear();

	if(in.length() < 4) return out;

	std::string::const_iterator i = in.begin();

	if(*i != '<') return out;
	i++;
	if(*i != '~') return out;
	i++;

	out.reserve(len);
	
	for(; i != in.end(); i++)
	{
		char c = *i;

		if(c >= '!' && c < 'v')
		{
			block[count++] = c;
		}

		switch(c)
		{
		case 'z':
			if(count == 1)
			{
				for(count = 0; count < 4; count++)
					out.push_back(0);
				count = 0;
			}
			break;
		case '~':
			if(count > 1)
			{
				switch(count)
				{
				case 2:
					block[2] = 'u';
				case 3:
					block[3] = 'u';
				case 4:
					block[4] = 'u';
				}
				tuple = decodeU32(block);
				for(;count > 1; count--)
				{
					out.push_back(char(tuple >> 24));
					tuple <<= 8;
				}
				count = 0;
			}
		}

		if(count == 5)
		{
			tuple = decodeU32(block);
			for(count = 0; count < 4; count++)
			{
				out.push_back(char(tuple >> 24));
				tuple <<= 8;
			}
			count = 0;
		}
	}

	return out;
}

//-- AES wrapper

#include <openssl/evp.h>

class EAESEncrypt::EncryptImpl {
public:
	EncryptImpl(const unsigned char *key, const unsigned char *iv);
	~EncryptImpl();

	std::vector<unsigned char> encrypt(const std::string &in);

	EVP_CIPHER_CTX ctx;
};

EAESEncrypt::EAESEncrypt(const unsigned char *key, const unsigned char *iv)
{
	mEncryptImpl = new EAESEncrypt::EncryptImpl(key, iv);
}

EAESEncrypt::EAESEncrypt(const std::vector<unsigned char> &key, const std::vector<unsigned char> &iv)
{
	mEncryptImpl = new EAESEncrypt::EncryptImpl(&key[0], &iv[0]);
}

EAESEncrypt::~EAESEncrypt()
{
	delete mEncryptImpl;
}

std::vector<unsigned char> EAESEncrypt::encrypt(const std::string &in)
{
	return mEncryptImpl->encrypt(in);
}

EAESEncrypt::EncryptImpl::EncryptImpl(const unsigned char *key, const unsigned char *iv)
{
	EVP_CIPHER_CTX_init(&ctx);
	EVP_EncryptInit_ex(&ctx, EVP_aes_128_cbc(), NULL, key, iv);
}

EAESEncrypt::EncryptImpl::~EncryptImpl()
{
	EVP_CIPHER_CTX_cleanup(&ctx);
}

std::vector<unsigned char> EAESEncrypt::EncryptImpl::encrypt(const std::string &in)
{
	std::vector<unsigned char> out;
	int outlen;
	int tmplen;

	out.resize(in.length() + 32);

	EVP_EncryptUpdate(&ctx, &out[0], &outlen, reinterpret_cast<const unsigned char *>(in.c_str()), in.length());
	EVP_EncryptFinal_ex(&ctx, &out[outlen], &tmplen);

	out.resize(outlen + tmplen);

	return out;
}

class EAESDecrypt::DecryptImpl {
public:
	DecryptImpl(const unsigned char *key, const unsigned char *iv);
	~DecryptImpl();

	std::string decrypt(const std::vector<unsigned char> &in);

	EVP_CIPHER_CTX ctx;
};

EAESDecrypt::EAESDecrypt(const unsigned char *key, const unsigned char *iv)
{
	mDecryptImpl = new EAESDecrypt::DecryptImpl(key, iv);
}

EAESDecrypt::EAESDecrypt(const std::vector<unsigned char> &key, const std::vector<unsigned char> &iv)
{
	mDecryptImpl = new EAESDecrypt::DecryptImpl(&key[0], &iv[0]);
}

EAESDecrypt::~EAESDecrypt()
{
	delete mDecryptImpl;
}

EAESDecrypt::DecryptImpl::DecryptImpl(const unsigned char *key, const unsigned char *iv)
{
	EVP_CIPHER_CTX_init(&ctx);
	EVP_DecryptInit_ex(&ctx, EVP_aes_128_cbc(), NULL, key, iv);
}

EAESDecrypt::DecryptImpl::~DecryptImpl()
{
	EVP_CIPHER_CTX_cleanup(&ctx);
}

std::string EAESDecrypt::decrypt(const std::vector<unsigned char> &in)
{
	return mDecryptImpl->decrypt(in);
}

std::string EAESDecrypt::DecryptImpl::decrypt(const std::vector<unsigned char> &in)
{
	std::vector<unsigned char> out;
	int outlen;
	int tmplen;

	if(in.size() == 0) return "";

	out.resize(in.size() + 32);

	EVP_DecryptUpdate(&ctx, &out[0], &outlen, &in[0], in.size());
	EVP_DecryptFinal_ex(&ctx, &out[outlen], &tmplen);

	out.resize(outlen + tmplen);

	if(out.empty())
		return "";

	return std::string(reinterpret_cast<const char *>(&out[0]), out.size());
}

EGenKey::EGenKey(const std::string &password, const unsigned char *salt)
{
	EVP_BytesToKey(EVP_aes_128_cbc(), EVP_sha1(), salt,
		reinterpret_cast<const unsigned char *>(password.c_str()), password.length(),
		1000, mKey, mIv);
}

EGenKey::~EGenKey()
{
	memset(mKey, 0, 16);
	memset(mIv, 0, 16);
}
