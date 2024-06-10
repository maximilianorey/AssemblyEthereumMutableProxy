package com.ethereum.structs;

public class Destination {
    private final long index;
    private final DestinationType destinationType;
    public Destination(long index, DestinationType destinationType){
        this.index = index;
        this.destinationType = destinationType;
    }

    public long getIndex() {
        return index;
    }

    public DestinationType getDestinationType() {
        return destinationType;
    }
}
