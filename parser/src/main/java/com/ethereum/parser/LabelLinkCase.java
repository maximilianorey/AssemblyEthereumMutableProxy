package com.ethereum.parser;

import com.ethereum.structs.Destination;
import com.ethereum.structs.Origin;


import com.ethereum.utils.Codes;

import java.util.*;

public class LabelLinkCase {
    private final List<Origin> sources = new LinkedList<>();
    private final Map<String, Destination> destination = new HashMap<>();

    public void addSource(Origin origin){
        sources.add(origin);
    }

    public Optional<String> addDestination(String label, Destination destination){
        if(Codes.reservedLabels.contains(label)){
            return Optional.of("LABEL '" + label + "' RESERVED.");
        }
        Destination valueBefore = this.destination.get(label);
        if(valueBefore!=null){
            return Optional.of("Destination already defined on " + valueBefore.getIndex() + " new value: " + destination.getIndex());
        }
        this.destination.put(label,destination);
        return Optional.empty();
    }

    public Iterator<Origin> getSources(){
        return this.sources.iterator();
    }

    public Destination getDestination(String label){
        return this.destination.get(label);
    }

}
