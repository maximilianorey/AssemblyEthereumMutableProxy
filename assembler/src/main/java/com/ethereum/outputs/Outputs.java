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
            }else{
                for(int i = 1;i<splited.length; i+=2){
                    splited[i] = parser.getParameter(splited[i]).toString();
                }
                writer.write(String.join("", splited).replace("<BINARYCODE>","0x" + codeStr));
            }
            writer.write("\n");
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
        int lastIndex = code.length()-64;
        for(int i = 0; i<lastIndex;i+=64){
            System.out.println("\tmstore(add(dat,"+ i/2 + "), 0x" + String.join("",code.substring(i,i+64)) + ")");
        }
        String substring = StringUtils.rightPad(code.substring(lastIndex),64,"0");
        System.out.println("\tmstore(add(dat,"+ lastIndex/2 + "), 0x" + String.join("",substring) + ")");

        for(String parameterKey: parser.getParametersKeys()){
            System.out.println("\tmstore(add(dat," + parser.getParameter(parameterKey) + ")," + parameterKey + ")");
        }
        System.out.println("\tmstore(proxyAddr,create(0,dat," + parser.getTotalLength() + "))");
        System.out.println("}");
        assemblyInput.close();
    }
}
