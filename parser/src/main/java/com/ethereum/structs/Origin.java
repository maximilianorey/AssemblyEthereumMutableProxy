package com.ethereum.structs;

public class Origin {
    private final long position;
    private final long line;
    private final int size;
    private final String label;
    public Origin(long position, long line, int size, String label){
        this.position = position;
        this.size = size;
        this.label = label;
        this.line = line;
    }

    public long getPosition() {
        return position;
    }

    public int getSize() {
        return size;
    }

    public String getLabel() {
        return label;
    }

    public long getLine() {
        return line;
    }
}
