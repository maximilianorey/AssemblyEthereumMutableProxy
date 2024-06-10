package com.ethereum.parser;

import com.ethereum.exceptions.ParserException;
import com.ethereum.structs.Destination;
import com.ethereum.structs.DestinationType;
import com.ethereum.structs.Origin;
import com.ethereum.utils.Codes;
import com.ethereum.utils.Utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.*;
import java.util.function.Function;

public class Parser {
    private final LabelLinkCase constructor = new LabelLinkCase();
    private final LabelLinkCase body = new LabelLinkCase();
    private long constructorSize = 0;
    private long bodySize = 0;
    private Map<String,Long> parameters = new HashMap<>();

    private static Optional<String> getLabel(String line, String delimiter){
        String[] splited = line.split(delimiter);
        if(splited.length>1){
            return Optional.of(splited[1]);
        }
        return Optional.empty();
    }

    private String directionForLabel(LabelLinkCase set, Origin origin, String line){
        Destination destination = switch (origin.getLabel()) {
            case "CONSTRUCTOR LENGTH" -> new Destination(constructorSize,DestinationType.OTHER);
            case "CODE LENGTH" -> new Destination(bodySize,DestinationType.OTHER);
            case "TOTAL LENGTH" -> new Destination(constructorSize + bodySize,DestinationType.OTHER);
            default -> set.getDestination(origin.getLabel());
        };
        if(destination==null){
            throw new ParserException(origin.getLine(), "Label destination not found");
        }
        String destinationStr = Long.toHexString(destination.getIndex());
        String res = Utils.extendsHexString(destinationStr,origin.getSize());
        if(res==null){
            throw new ParserException(origin.getLine(), "Destination pointer too long (size on origin: " + origin.getSize() + " pointer size: " + destinationStr.length() + ")");
        }
        if(!destination.getDestinationType().equals(DestinationType.DESTJUMP) && line.substring(2,4).equals("57")){
            throw new ParserException(origin.getLine(), "Jump to non DESTJUMP instruction");
        }
        return res;
    }

    private long process(BufferedReader input, LabelLinkCase set, Function<String,Boolean> endCondition, long initialLine, Function<Long,Long> calculateIndex) throws IOException {
        long index = 0;
        long lineNumber = initialLine;
        for(String line = input.readLine();endCondition.apply(line); line = input.readLine()){
            String _line = line.trim();
            if(!_line.isEmpty() && !_line.startsWith("//")) {
                long _index = index;
                long _lineNumber = lineNumber;
                getLabel(line, "<D>").ifPresent(label -> {
                    String code = _line.substring(2, 4);
                    //TODO DestinationType error
                    set.addDestination(label, new Destination(_index, code.equals("5B") ? DestinationType.DESTJUMP : DestinationType.OTHER)).ifPresent(error -> {
                        throw new ParserException(_lineNumber, "code with source label is not a push: " + code);
                    });
                });
                getLabel(line, "<P>").ifPresent(label ->{
                    parameters.put(label,calculateIndex.apply(_index));
                });
                Optional<String> source = getLabel(line, "<S>");
                if (source.isPresent()) {
                    String label = source.get();
                    String code = _line.substring(2, 4);
                    Integer size = Codes.pushCodes.get(code);
                    if (size == null) {
                        throw new ParserException(_lineNumber, "code with source label is not a push: " + code);
                    }
                    set.addSource(new Origin(_index, _lineNumber, size, label));
                    index += size;
                }
                index += 1;
            }
            lineNumber += 1;
        }
        return index;
    }

    public void processFile(BufferedReader input) throws IOException {
        this.constructorSize = process(input,constructor, line -> !line.equals("END CONSTRUCTOR"),1, x -> x);
        this.bodySize = process(input,body, Objects::nonNull,this.constructorSize, x -> x + this.constructorSize);
    }

    private List<String> generateCodeAux(BufferedReader input,LabelLinkCase set, Function<String,Boolean> endCondition) throws IOException {
        Iterator<Origin> iterator = set.getSources();
        List<String> res = new LinkedList<>();
        long index = 0;
        Origin origin = iterator.next();
        for(String line = input.readLine(); endCondition.apply(line); line = input.readLine()){
            String _line = line.trim();
            if(!_line.isEmpty() && !_line.startsWith("//")) {
                res.add(_line.substring(2, 4));
                if (origin != null && index == origin.getPosition()) {
                    res.add(directionForLabel(set, origin,_line));
                    index += origin.getSize();
                    origin = iterator.hasNext() ? iterator.next() : null;
                }
                index += 1;
            }
        }
        return res;
    }

    public String generateCode(BufferedReader input) throws IOException {
        List<String> constructor = generateCodeAux(input,this.constructor,line -> !line.equals("END CONSTRUCTOR"));
        List<String> body = generateCodeAux(input,this.body,Objects::nonNull);
        return String.join("",constructor) + String.join("",body);
    }

    public Long getParameter(String label){
        return this.parameters.get(label);
    }

    public Set<String> getParametersKeys(){
        return this.parameters.keySet();
    }

    public long getTotalLength(){
        return this.bodySize + this.constructorSize;
    }
}
