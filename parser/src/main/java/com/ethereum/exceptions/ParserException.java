package com.ethereum.exceptions;

public class ParserException extends RuntimeException{
    public ParserException(long line, String message){
        super("On line: " + line + ": " + message);
    }
}
