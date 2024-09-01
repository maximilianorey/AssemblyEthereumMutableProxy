package com.ethereum.utils;

import org.apache.commons.lang3.StringUtils;

public class Utils {
    public static boolean equalsWithNullCase(Object elem1, Object elem2){
        if(elem1==null) return elem2==null;
        return elem1.equals(elem2);
    }

    public static String extendsHexString(String str, int size){
        if(str.length()==size*2){
            return str;
        }
        if(str.length()<size*2){
            return StringUtils.leftPad(str,size*2,"0");
        }
        System.err.println("String too short: '" + str + "' for size: " + size);
        return null;
    }
}
