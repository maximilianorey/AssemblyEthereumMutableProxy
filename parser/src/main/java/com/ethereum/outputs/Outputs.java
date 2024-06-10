package com.ethereum.outputs;

import com.ethereum.parser.Parser;
import org.apache.commons.lang3.StringUtils;

import java.io.*;

public class Outputs {
    public static void fromTypescriptTemplate(Parser parser, String[] argv) throws IOException {
        if(argv.length < 5){
            System.err.println("fromTemplate <assembly> <input_file> <output_file>");
            System.exit(1);
        }
        BufferedReader assemblyInput = new BufferedReader(new FileReader(argv[2]));
        BufferedReader input = new BufferedReader(new FileReader(argv[3]));
        BufferedWriter writer = new BufferedWriter(new FileWriter(argv[4]));
        String codeStr = parser.generateCode(assemblyInput);
        for(String line = input.readLine(); line!=null;line = input.readLine()){
            String[] splited = line.split("<P>");
            if(splited.length == 1){
                writer.write(line.replace("<BINARYCODE>","0x" + codeStr));
                writer.write("\n");
            }else{
                for(int i = 1;i<splited.length; i+=2){
                    splited[i] = parser.getParameter(splited[i]).toString();
                }
                writer.write(String.join("", splited).replace("<BINARYCODE>","0x" + codeStr));
                writer.write("\n");
            }
        }
        assemblyInput.close();
        input.close();
        writer.close();
    }

    public static void printCode(Parser parser, String[] argv) throws IOException {
        BufferedReader assemblyInput = new BufferedReader(new FileReader(argv[2]));
        System.out.println(parser.generateCode(assemblyInput));
        for(String parameterKey: parser.getParametersKeys()){
            System.out.println(parameterKey + ": " + parser.getParameter(parameterKey));
        }
        assemblyInput.close();
    }

    public static void solidityInject(Parser parser, String[] argv) throws IOException {
        BufferedReader assemblyInput = new BufferedReader(new FileReader(argv[2]));
        String code = parser.generateCode(assemblyInput);
        System.out.println("bytes memory dat = new bytes("+ parser.getTotalLength() +");");
        System.out.println("assembly{");
        for(int i = 0; i<code.length();i+=32){
            String substr;
            if(i+32 < code.length()){
                substr = code.substring(i,i+32);
            }else{
                substr = StringUtils.rightPad(code.substring(i),32,"0");
            }
            System.out.println("\tmstore(add(dat,"+ i + "), 0x" + String.join("",substr) + ")");
        }
        for(String parameterKey: parser.getParametersKeys()){
            System.out.println("\tmstore(add(dat," + parser.getParameter(parameterKey) + ")," + parameterKey + ")");
        }
        System.out.println("}");
        assemblyInput.close();
    }
}
