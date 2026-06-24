package com.lu.admin.common.utils;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class AESUtil {

    /**
     * @param data 待加密数据
     * @param key  key
     * @param iv   偏移量
     * @return 加密
     * @throws Exception
     */
    public static byte[] encrypt(byte[] data, byte[] key, byte[] iv) throws Exception {
        Cipher cipher = getCipher(Cipher.ENCRYPT_MODE, key, iv);
        return cipher.doFinal(data);
    }

    /**
     * @param data 待解密数据
     * @param key  key
     * @param iv   偏移量
     * @return 解密
     * @throws Exception
     */
    public static byte[] decrypt(byte[] data, byte[] key, byte[] iv) throws Exception {
        Cipher cipher = getCipher(Cipher.DECRYPT_MODE, key, iv);
        return cipher.doFinal(data);
    }

    private static Cipher getCipher(int mode, byte[] key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key, "AES");
        cipher.init(mode, secretKeySpec, new IvParameterSpec(iv));
        return cipher;
    }

}
