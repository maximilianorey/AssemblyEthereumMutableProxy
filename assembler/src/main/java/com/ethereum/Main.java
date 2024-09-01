package com.ethereum;

import com.ethereum.outputs.Outputs;
import com.ethereum.parser.Parser;

import java.io.*;

public class Main {
    private static void printError(){
        System.err.println("fromTemplate <assembly> <input_file> <output_file>");
        System.err.println("printCode <assembly>");
        System.err.println("solidityInject <assembly>");
    }
    public static void main(String[] argv) throws IOException {
        if(argv.length < 3){
            printError();
            System.exit(1);
        }
        BufferedReader input = new BufferedReader(new FileReader(argv[2]));
        Parser parser = new Parser();
        parser.processFile(input);
        input.close();
        switch (argv[1]){
            case "fromTemplate":
                Outputs.fromTypescriptTemplate(parser,argv);
                break;
            case "printCode":
                Outputs.printCode(parser,argv);
                break;
            case "solidityInject":
                Outputs.solidityInject(parser,argv);
                break;
            default:
                printError();
        }
    }
}
