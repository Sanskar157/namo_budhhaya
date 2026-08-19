
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "bold",
    color: "#222",
  },
  subheading: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  section: {
    marginBottom: 10,
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 5,
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  row: {
    marginBottom: 5,
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
});

const ReceiptDocument = ({ receipt }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Namo Buddhaya Donation Receipt</Text>
      <Text style={styles.subheading}>Thank you for your support</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Receipt ID:</Text> {receipt.id}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Name:</Text>{" "}
            {receipt.name || "Anonymous"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Phone:</Text> {receipt.phone}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Amount:</Text> ₹{receipt.amount}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Payment ID:</Text>{" "}
            {receipt.paymentId}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Order ID:</Text>{" "}
            {receipt.orderId}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>
            <Text style={styles.label}>Date:</Text> {Date.now()}
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        This receipt serves as confirmation of your donation to Namo Buddhaya.
      </Text>
    </Page>
  </Document>
);

export default ReceiptDocument;
