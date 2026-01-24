import java.io.*;
public class BufferedWriterExample {
    public static void main(String[] args) throws Exception
    {
// A stream that connects to the text file
        FileWriter writer = new FileWriter("D:\\testout.txt");
// Connect the FileWriter to the BufferedWriter
        BufferedWriter buffer = new BufferedWriter(writer);
        buffer.write("Welcome to mkce");
        buffer.close();
        System.out.println("Success");
    }
}