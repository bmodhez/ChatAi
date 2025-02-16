import Together from "together-ai";

const together = new Together();

const response = await together.chat.completions.create({
    messages: [{"role": "user", "content": "What are some fun things to do in New York?"}],
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
});

console.log(response.choices[0].message.content)