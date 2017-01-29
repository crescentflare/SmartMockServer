package com.crescentflare.smartmock.utility;

import android.content.Context;
import android.content.res.AssetFileDescriptor;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

/**
 * Smart mock library utility: easily access files with file:/// or assets:/// prefix
 */
public class SmartMockFileUtility
{
    /**
     * Private constructor, only static methods allowed
     */

    private SmartMockFileUtility()
    {
    }


    /**
     * Utility functions
     */

    public static String[] list(Context context, String path)
    {
        String[] fileList = null;
        if (isAssetFile(path))
        {
            try
            {
                fileList = context.getAssets().list(getRawPath(path));
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            fileList = new File(getRawPath(path)).list();
        }
        if (fileList != null)
        {
            List<String> filteredList = new ArrayList<>();
            for (String fileItem : fileList)
            {
                if (!fileItem.toLowerCase().equals("thumbs.db") && !fileItem.toLowerCase().equals(".ds_store"))
                {
                    filteredList.add(fileItem);
                }
            }
            return filteredList.toArray(new String[filteredList.size()]);
        }
        return null;
    }

    public static String[] recursiveList(Context context, String path)
    {
        String[] items = list(context, path);
        if (items != null)
        {
            List<String> files = new ArrayList<>();
            for (String item : items)
            {
                boolean isFile = SmartMockFileUtility.getLength(context, path + "/" + item) > 0;
                if (!isFile)
                {
                    String[] dirFiles = recursiveList(context, path + "/" + item);
                    if (dirFiles != null)
                    {
                        for (String dirFile : dirFiles)
                        {
                            files.add(item + "/" + dirFile);
                        }
                    }
                }
                else
                {
                    files.add(item);
                }
            }
            return files.toArray(new String[files.size()]);
        }
        return null;
    }

    public static InputStream open(Context context, String path)
    {
        if (isAssetFile(path))
        {
            try
            {
                return context.getAssets().open(getRawPath(path));
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            try
            {
                new FileInputStream(getRawPath(path));
            }
            catch (FileNotFoundException ignored)
            {
            }
        }
        return null;
    }

    public static long getLength(Context context, String path)
    {
        if (isAssetFile(path))
        {
            try
            {
                AssetFileDescriptor info = context.getAssets().openFd(getRawPath(path));
                return info.getLength();
            }
            catch (IOException ignored)
            {
            }
            try
            {
                InputStream inputStream = context.getAssets().open(getRawPath(path));
                long length = inputStream.available();
                inputStream.close();
                return length;
            }
            catch (IOException ignored)
            {
            }
        }
        else
        {
            File file = new File(getRawPath(path));
            if (file.exists())
            {
                return file.length();
            }
        }
        return -1;
    }

    public static boolean exists(Context context, String path)
    {
        return getLength(context, path) >= 0;
    }

    public static String readFromInputStream(InputStream stream)
    {
        final int bufferSize = 1024;
        final char[] buffer = new char[bufferSize];
        final StringBuilder out = new StringBuilder();
        String result = null;
        try
        {
            Reader in = new InputStreamReader(stream, "UTF-8");
            for ( ; ; )
            {
                int rsz = in.read(buffer, 0, buffer.length);
                if (rsz < 0)
                {
                    break;
                }
                out.append(buffer, 0, rsz);
            }
            result = out.toString();
            stream.close();
        }
        catch (Exception ignored)
        {
        }
        return result;
    }

    public static String obtainMD5(Context context, String path)
    {
        InputStream inputStream = open(context, path);
        if (inputStream != null)
        {
            String result = "";
            MessageDigest digest;
            try
            {
                digest = MessageDigest.getInstance("MD5");
            }
            catch (NoSuchAlgorithmException exception)
            {
                return "";
            }
            byte[] buffer = new byte[8192];
            int read;
            try
            {
                while ((read = inputStream.read(buffer)) > 0)
                {
                    digest.update(buffer, 0, read);
                }
                byte[] md5sum = digest.digest();
                BigInteger bigInt = new BigInteger(1, md5sum);
                String output = bigInt.toString(16);
                result = String.format("%32s", output).replace(' ', '0');
                inputStream.close();
            }
            catch (IOException ignored)
            {
            }
            return result;
        }
        return "";
    }

    public static boolean isAssetFile(String path)
    {
        return path.startsWith("assets:///");
    }

    public static String getRawPath(String path)
    {
        if (isAssetFile(path))
        {
            return path.replace("assets:///", "");
        }
        return path.replace("file:///", "");
    }
}
